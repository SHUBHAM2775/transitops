"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, Star, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  type DispatchVehicle,
  type DispatchDriver,
  type ScoredCandidate,
  rankCandidates,
} from "@/lib/dispatch-engine";

// Re-use helpers from trips.tsx for fetching & mapping
interface DBVehicle {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  max_load_capacity: number;
  odometer: number;
  status: string;
  region: string | null;
}

interface DBDriverRow {
  id: string;
  name: string;
  license_category: string;
  license_expiry: string;
  status: string;
}

const mapVehicleStatusToUI = (s: string): DispatchVehicle["status"] => {
  switch (s?.toLowerCase()) {
    case "available": return "Available";
    case "on_trip": return "On Trip";
    case "in_shop": return "In Shop";
    case "retired": return "Retired";
    default: return "Available";
  }
};

const mapDriverStatusToUI = (s: string): DispatchDriver["status"] => {
  switch (s?.toLowerCase()) {
    case "available": return "Available";
    case "on_trip": return "On Trip";
    case "off_duty": return "Off Duty";
    case "suspended": return "Suspended";
    default: return "Available";
  }
};

const formatExpiry = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${mm}/${d.getFullYear()}`;
};

const generateTripNumber = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  return `TR-${ts}`;
};

// ─── Chat Types ─────────────────────────────────────────────

interface ParsedIntent {
  cargoWeight: number;
  plannedDistance: number;
  source: string;
  destination: string;
}

interface Message {
  id: string;
  role: "user" | "copilot";
  content: string;
  intent?: ParsedIntent;
  recommendations?: ScoredCandidate[];
  selectedCandidateIndex?: number;
  dispatched?: boolean;
}

const INITIAL_MESSAGE: Message = {
  id: "msg_1",
  role: "copilot",
  content: "Hi! I'm your AI Dispatch Copilot. Tell me what needs to be shipped, and I'll find the best vehicle and driver instantly.\n\nTry saying: *\"Send 400kg from Mumbai to Pune (150km)\"*",
};

export function CopilotSection() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null); // message id
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session data
  useEffect(() => {
    const saved = localStorage.getItem("transitops_copilot_session");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse copilot session", err);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save session data
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("transitops_copilot_session", JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  // DB Data
  const [dbVehicles, setDbVehicles] = useState<DispatchVehicle[]>([]);
  const [dbDrivers, setDbDrivers] = useState<DispatchDriver[]>([]);

  // ─── Data Fetching ────────────────────────────────────────

  const fetchLiveFleet = async () => {
    try {
      // Vehicles
      const { data: vData } = await supabase.from("vehicles").select("id, vehicle_name, vehicle_type, max_load_capacity, odometer, status, region");
      if (vData) {
        setDbVehicles(vData.map((v: DBVehicle) => ({
          id: v.id,
          name: v.vehicle_name,
          type: v.vehicle_type,
          capacityKg: Number(v.max_load_capacity),
          odometer: Number(v.odometer),
          status: mapVehicleStatusToUI(v.status),
          region: v.region || "",
        })));
      }

      // Drivers
      const { data: dData } = await supabase.from("drivers").select("id, name, license_category:category, license_expiry, status");
      const { data: tripsData } = await supabase.from("trips").select("driver_id, status");
      
      const completedMap: Record<string, number> = {};
      const totalMap: Record<string, number> = {};
      
      if (tripsData) {
        tripsData.forEach((t: { driver_id: string | null; status: string }) => {
          if (t.driver_id) {
            if (t.status !== "draft") totalMap[t.driver_id] = (totalMap[t.driver_id] || 0) + 1;
            if (t.status === "completed") completedMap[t.driver_id] = (completedMap[t.driver_id] || 0) + 1;
          }
        });
      }

      if (dData) {
        setDbDrivers(dData.map((d: DBDriverRow) => {
          const comp = completedMap[d.id] || 0;
          const tot = totalMap[d.id] || 0;
          const rate = tot > 0 ? Math.round((comp / tot) * 100) : 100;
          return {
            id: d.id,
            name: d.name,
            licenseCategory: d.license_category,
            licenseExpiry: formatExpiry(d.license_expiry),
            tripCompletionRate: rate,
            status: mapDriverStatusToUI(d.status),
          };
        }));
      }
    } catch (err) {
      console.error("Error fetching for copilot:", err);
    }
  };

  useEffect(() => {
    fetchLiveFleet();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ─── Intent Parsing ───────────────────────────────────────

  const parsePrompt = (text: string): ParsedIntent => {
    // Simple heuristic parser for the hackathon
    const weightMatch = text.match(/(\d+)\s*(kg|kilos|kilograms)/i);
    const distMatch = text.match(/(\d+)\s*(km|kilometers)/i);
    const fromMatch = text.match(/from\s+([a-zA-Z\s]+?)(?=\s+to|\s+\d|$)/i);
    const toMatch = text.match(/to\s+([a-zA-Z\s]+?)(?=\s+from|\s+\d|$|\s*\()/i);

    return {
      cargoWeight: weightMatch ? parseInt(weightMatch[1], 10) : 0,
      plannedDistance: distMatch ? parseInt(distMatch[1], 10) : 0,
      source: fromMatch ? fromMatch[1].trim() : "Unknown Source",
      destination: toMatch ? toMatch[1].trim() : "Unknown Destination",
    };
  };

  // ─── Interaction ──────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setInputValue("");
    
    // Add user message
    const userMsg: Message = { id: `msg_${Date.now()}`, role: "user", content: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Refresh fleet to ensure we don't recommend a busy vehicle
    await fetchLiveFleet();

      setTimeout(() => {
        const intent = parsePrompt(userText);
        let content = "";
        let topCandidates: ScoredCandidate[] = [];

        if (intent.cargoWeight > 0) {
          const recommendations = rankCandidates(dbVehicles, dbDrivers, {
            cargoWeightKg: intent.cargoWeight,
            plannedDistanceKm: intent.plannedDistance,
          });

          if (recommendations.length > 0) {
            topCandidates = recommendations.slice(0, 3);
            content = `I found some excellent matches for ${intent.cargoWeight}kg going from ${intent.source} to ${intent.destination}. Please select one to dispatch.`;
          } else {
            content = `I couldn't find any available vehicle/driver pairs that can handle ${intent.cargoWeight}kg right now.`;
          }
        } else {
          content = "I need to know the cargo weight (e.g. '400kg') to make a recommendation. Could you clarify?";
        }

        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          role: "copilot",
          content,
          intent: intent.cargoWeight > 0 ? intent : undefined,
          recommendations: topCandidates.length > 0 ? topCandidates : undefined,
          selectedCandidateIndex: topCandidates.length > 0 ? 0 : undefined,
        }]);
        setIsTyping(false);
      }, 1000); // Simulate "thinking" delay
  };

  const handleDispatch = async (msgId: string, intent: ParsedIntent, candidate: ScoredCandidate) => {
    setIsDispatching(msgId);
    try {
      const tripNum = generateTripNumber();
      const { error } = await supabase.from("trips").insert({
        trip_number: tripNum,
        source: intent.source,
        destination: intent.destination,
        cargo_weight: intent.cargoWeight,
        planned_distance: intent.plannedDistance,
        vehicle_id: candidate.vehicle.id,
        driver_id: candidate.driver.id,
        status: "dispatched",
      });
      if (error) throw error;

      await supabase.from("vehicles").update({ status: "on_trip" }).eq("id", candidate.vehicle.id);
      await supabase.from("drivers").update({ status: "on_trip" }).eq("id", candidate.driver.id);

      // Update message to show dispatched state
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, dispatched: true } : m));
      
      // Refresh fleet data instantly in the background so future queries are correct
      await fetchLiveFleet();
      
      // Send confirmation
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          role: "copilot",
          content: `✅ Successfully dispatched **${tripNum}**! ${candidate.vehicle.name} and ${candidate.driver.name} are now On Trip.`,
        }]);
      }, 500);

    } catch (err) {
      console.error("Copilot Dispatch Error:", err);
    } finally {
      setIsDispatching(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ─── Render ───────────────────────────────────────────────

  if (!isLoaded) return null; // Avoid hydration mismatch

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto bg-[#020204] border border-sidebar-border/50 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar-accent/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">AI Dispatch Copilot</h2>
            <p className="text-xs text-muted-foreground">Natural language routing & assignment</p>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-900/20" 
                : "bg-sidebar-accent/40 border border-sidebar-border/50 text-foreground rounded-bl-none"
            }`}>
              {/* Text content */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                  part.startsWith("**") && part.endsWith("**") ? 
                    <strong key={i} className="font-bold text-blue-400">{part.slice(2, -2)}</strong> 
                    : part
                )}
              </div>

              {/* Recommendation Cards */}
              {msg.role === "copilot" && msg.recommendations && msg.intent && (
                <div className="mt-4 space-y-3">
                  {msg.recommendations.map((candidate, idx) => {
                    const isSelected = msg.selectedCandidateIndex === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => !msg.dispatched && setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, selectedCandidateIndex: idx } : m))}
                        className={`bg-[#0a0a0c] border rounded-xl p-4 transition-all ${
                          !msg.dispatched ? 'cursor-pointer hover:border-blue-500/50' : 'opacity-75 cursor-default'
                        } ${isSelected ? 'border-blue-500 shadow-inner' : 'border-sidebar-border'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            <span className="text-sm font-semibold text-foreground">{candidate.vehicle.name}</span>
                            <span className="text-muted-foreground text-sm">+</span>
                            <span className="text-sm font-semibold text-foreground">{candidate.driver.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${
                              candidate.score >= 80 ? 'text-green-400' :
                              candidate.score >= 60 ? 'text-blue-400' : 'text-yellow-400'
                            }`}>
                              Score: {candidate.score}
                            </span>
                            {isSelected && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background shadow-sm" />}
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden mb-3">
                          <div
                            className={`h-full rounded-full ${getScoreColor(candidate.score)}`}
                            style={{ width: `${candidate.score}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>Capacity: {candidate.vehicle.capacityKg}kg</span>
                          <span>Odometer: {candidate.vehicle.odometer}km</span>
                          <span>License: {candidate.driver.licenseCategory}</span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    {msg.dispatched ? (
                      <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Dispatched Successfully
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleDispatch(msg.id, msg.intent!, msg.recommendations![msg.selectedCandidateIndex || 0])}
                        disabled={isDispatching !== null || msg.selectedCandidateIndex === undefined}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                      >
                        {isDispatching === msg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        {isDispatching === msg.id ? "Dispatching..." : "Dispatch Selected Match"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-sidebar-accent/40 border border-sidebar-border/50 rounded-2xl rounded-bl-none px-5 py-4 flex gap-1.5 items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
        
        {/* Suggestion Chips */}
        {messages.length === 1 && !isTyping && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => setInputValue("Send 400kg from Mumbai to Pune (150km)")}
              className="text-xs px-3 py-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              "Send 400kg from Mumbai to Pune (150km)"
            </button>
            <button 
              onClick={() => setInputValue("Need a heavy truck for 3500kg going to Surat")}
              className="text-xs px-3 py-1.5 rounded-full border border-sidebar-border bg-sidebar-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              "Need a heavy truck for 3500kg going to Surat"
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your dispatch request naturally..."
            className="w-full bg-sidebar-accent/30 border-sidebar-border h-12 pr-14 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500/50"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="absolute right-1.5 h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
