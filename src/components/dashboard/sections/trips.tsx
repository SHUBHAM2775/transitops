"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Trash2, Star, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  type DispatchVehicle,
  type DispatchDriver,
  type ScoredCandidate,
  rankCandidates,
} from "@/lib/dispatch-engine";

type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle: string;
  driver: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  eta: string;
}

// ─── Mock Data (aligned with fleet & drivers sections) ──────

const mockVehicles: DispatchVehicle[] = [
  { id: "v1", name: "VAN-05",    type: "Van",   capacityKg: 500,  odometer: 45000,  status: "Available", region: "Ahmedabad" },
  { id: "v2", name: "TRUCK-04",  type: "Truck", capacityKg: 2000, odometer: 120000, status: "Available", region: "Gandhinagar" },
  { id: "v3", name: "MINI-08",   type: "Mini",  capacityKg: 300,  odometer: 28000,  status: "Available", region: "Ahmedabad" },
  { id: "v4", name: "TRUCK-11",  type: "Truck", capacityKg: 5000, odometer: 310000, status: "On Trip",   region: "Surat" },
  { id: "v5", name: "VAN-12",    type: "Van",   capacityKg: 800,  odometer: 67000,  status: "Available", region: "Vadodara" },
  { id: "v6", name: "MINI-03",   type: "Mini",  capacityKg: 250,  odometer: 15000,  status: "In Shop",   region: "Ahmedabad" },
];

const mockDrivers: DispatchDriver[] = [
  { id: "d1", name: "Alex",   licenseCategory: "LMV", licenseExpiry: "12/2028", tripCompletionRate: 96, status: "Available" },
  { id: "d2", name: "John",   licenseCategory: "HMV", licenseExpiry: "03/2025", tripCompletionRate: 81, status: "Suspended" },
  { id: "d3", name: "Priya",  licenseCategory: "LMV", licenseExpiry: "08/2027", tripCompletionRate: 99, status: "Available" },
  { id: "d4", name: "Suresh", licenseCategory: "HMV", licenseExpiry: "01/2027", tripCompletionRate: 88, status: "Available" },
  { id: "d5", name: "Ravi",   licenseCategory: "LMV", licenseExpiry: "06/2029", tripCompletionRate: 92, status: "Available" },
];

const initialTrips: Trip[] = [
  { id: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub", vehicle: "VAN-05", driver: "ALEX", cargoWeight: 450, plannedDistance: 38, status: "Dispatched", eta: "45 min" },
  { id: "TR004", source: "Vatva Industrial Area", destination: "Sanand Warehouse", vehicle: "TRUCK-04", driver: "SURESH", cargoWeight: 200, plannedDistance: 55, status: "Draft", eta: "Awaiting driver" },
  { id: "TR006", source: "Mansa", destination: "Kalol Depot", vehicle: "Unassigned", driver: "Unassigned", cargoWeight: 0, plannedDistance: 25, status: "Cancelled", eta: "Vehicle went to shop" },
];

// ─── Component ──────────────────────────────────────────────

export function TripsSection() {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Trip>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);

  // Recommendation engine
  const recommendations = useMemo(() => {
    const weight = formData.cargoWeight || 0;
    const dist = formData.plannedDistance || 0;
    if (weight <= 0) return [];
    return rankCandidates(mockVehicles, mockDrivers, {
      cargoWeightKg: weight,
      plannedDistanceKm: dist,
    });
  }, [formData.cargoWeight, formData.plannedDistance]);

  const handleTripClick = (trip: Trip) => {
    setIsCreating(false);
    setFormData(trip);
    setSelectedCandidate(null);
    setIsModalOpen(true);
  };

  const handleNewTrip = () => {
    setIsCreating(true);
    setFormData({
      status: "Draft",
      source: "",
      destination: "",
      vehicle: "",
      driver: "",
      cargoWeight: 0,
      plannedDistance: 0,
    });
    setSelectedCandidate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setSelectedCandidate(null);
  };

  const handleSelectCandidate = (candidate: ScoredCandidate) => {
    setSelectedCandidate(candidate);
    setFormData(prev => ({
      ...prev,
      vehicle: candidate.vehicle.name,
      driver: candidate.driver.name,
    }));
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrips(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setTrips(prev => prev.filter(t => !selectedTrips.includes(t.id)));
    setSelectedTrips([]);
  };

  // Validation (uses selected candidate's vehicle if available)
  const activeVehicle = selectedCandidate?.vehicle;
  const capacity = activeVehicle ? activeVehicle.capacityKg : 0;
  const weight = formData.cargoWeight || 0;
  const isOverweight = activeVehicle ? weight > capacity : false;
  const exceededBy = weight - capacity;

  // ─── Lifecycle Renderer ───────────────────────────────────

  const renderLifecycle = (status: TripStatus) => {
    const steps = ["Draft", "Dispatched", "Completed", "Cancelled"];
    let currentIndex = steps.indexOf(status);
    if (currentIndex === -1) currentIndex = 0;

    return (
      <div className="mb-8 mt-2">
        <h3 className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold mb-6">Trip Lifecycle</h3>
        <div className="flex items-center justify-between relative px-2">
          {/* Base Gray Line */}
          <div className="absolute left-0 top-3 w-full h-0.5 bg-secondary/50 -z-10" />

          {/* Highlighted Progress Line */}
          {currentIndex > 0 && (
            <div
              className={`absolute left-0 top-3 h-0.5 -z-10 transition-all duration-500 ease-in-out ${
                status === "Cancelled" ? "bg-red-500" : (status === "Completed" ? "bg-muted-foreground" : "bg-blue-500")
              }`}
              style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            />
          )}

          {steps.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isPast = idx < currentIndex;

            let circleColor = "bg-secondary";
            let textColor = "text-muted-foreground";

            if (isActive) {
              if (step === "Draft") { circleColor = "bg-green-500"; textColor = "text-green-500"; }
              if (step === "Dispatched") { circleColor = "bg-blue-500"; textColor = "text-blue-500"; }
              if (step === "Completed") { circleColor = "bg-muted-foreground"; textColor = "text-foreground"; }
              if (step === "Cancelled") { circleColor = "bg-red-500"; textColor = "text-red-500"; }
            } else if (isPast) {
              if (status === "Cancelled") {
                circleColor = "bg-red-500";
                textColor = "text-red-500";
              } else if (status === "Completed") {
                circleColor = "bg-muted-foreground";
                textColor = "text-foreground";
              } else {
                circleColor = "bg-blue-500";
                textColor = "text-blue-500";
              }
            }

            return (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-6 h-6 rounded-full border-4 border-background ${circleColor}`} />
                <span className={`text-[10px] font-semibold ${textColor}`}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Score Bar Color ──────────────────────────────────────

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 flex flex-col space-y-6">

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedTrips.length > 0 && (
            <Button
              onClick={handleDeleteSelected}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 h-10 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedTrips.length})
            </Button>
          )}
          <Button onClick={handleNewTrip} className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 h-10 w-full sm:w-auto shadow-sm">
            <Plus className="w-4 h-4" />
            Create Trip
          </Button>
        </div>
      </div>

      {/* Grid of Trips */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips.map(trip => {
          const isSelected = selectedTrips.includes(trip.id);

          return (
            <div
              key={trip.id}
              onClick={() => handleTripClick(trip)}
              className={`relative p-5 rounded-xl border border-dashed transition-all cursor-pointer group hover:border-muted-foreground/80 bg-[#020204] shadow-sm ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
            >
              <div
                className="absolute top-4 right-4 z-10"
                onClick={(e) => handleToggleSelect(trip.id, e)}
              >
                <Checkbox
                  checked={isSelected}
                  className={`border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                />
              </div>

              <div className="flex justify-between items-start mb-3 pr-8">
                <span className="text-sm font-semibold text-muted-foreground">{trip.id}</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {trip.vehicle} / {trip.driver}
                </span>
              </div>
              <p className="text-base text-foreground mb-6 font-medium">
                {trip.source} {'->'} {trip.destination}
              </p>
              <div className="flex justify-between items-end">
                <div className={`px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm
                  ${trip.status === 'Dispatched' ? 'bg-blue-500 text-white' : ''}
                  ${trip.status === 'Draft' ? 'bg-secondary text-muted-foreground' : ''}
                  ${trip.status === 'Cancelled' ? 'bg-red-400 text-black' : ''}
                  ${trip.status === 'Completed' ? 'bg-green-500 text-white' : ''}
                `}>
                  {trip.status}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{trip.eta}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-border/20 text-center sm:text-left">
        <p className="text-xs text-muted-foreground font-medium">
          On Complete: odometer -{">"} fuel log -{">"} expenses -{">"} Vehicle & Driver Available
        </p>
      </div>

      {/* ─── Modal for Create/Edit ─────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[700px] bg-[#020204] border-border/50 p-0 overflow-hidden shadow-2xl"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 bg-card/30">
            <DialogTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {isCreating ? "Create New Trip" : "Trip Details"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="flex-1 flex flex-col">
              {renderLifecycle(formData.status as TripStatus || "Draft")}

              <div className="space-y-5">
                {/* Source / Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Source</Label>
                    <Input
                      value={formData.source || ""}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. Gandhinagar Depot"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Destination</Label>
                    <Input
                      value={formData.destination || ""}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. Ahmedabad Hub"
                    />
                  </div>
                </div>

                {/* Cargo / Distance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Cargo Weight (kg)</Label>
                    <Input
                      type="number"
                      value={formData.cargoWeight || ""}
                      onChange={(e) => {
                        setFormData({...formData, cargoWeight: Number(e.target.value), vehicle: "", driver: ""});
                        setSelectedCandidate(null);
                      }}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. 450"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Planned Distance (km)</Label>
                    <Input
                      type="number"
                      value={formData.plannedDistance || ""}
                      onChange={(e) => setFormData({...formData, plannedDistance: Number(e.target.value)})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. 38"
                    />
                  </div>
                </div>

                {/* ─── Recommendation Engine Results ───────── */}
                {(formData.cargoWeight || 0) > 0 && (
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <h3 className="text-[10px] uppercase text-muted-foreground tracking-widest font-semibold">
                        Recommended Pairs ({recommendations.length} eligible)
                      </h3>
                    </div>

                    {recommendations.length === 0 ? (
                      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                        <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          No eligible vehicle+driver pair found for {formData.cargoWeight} kg cargo.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                        {recommendations.map((candidate, idx) => {
                          const isChosen = selectedCandidate?.vehicle.id === candidate.vehicle.id &&
                                           selectedCandidate?.driver.id === candidate.driver.id;
                          return (
                            <div
                              key={`${candidate.vehicle.id}-${candidate.driver.id}`}
                              onClick={() => handleSelectCandidate(candidate)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                isChosen
                                  ? 'border-blue-500/60 bg-blue-500/5 shadow-lg shadow-blue-500/5'
                                  : 'border-border/40 hover:border-muted-foreground/40'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  {idx === 0 && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                                  <span className="text-sm font-semibold text-foreground">
                                    {candidate.vehicle.name}
                                  </span>
                                  <span className="text-muted-foreground text-sm">+</span>
                                  <span className="text-sm font-semibold text-foreground">
                                    {candidate.driver.name}
                                  </span>
                                  {isChosen && <CheckCircle2 className="w-4 h-4 text-blue-500 ml-1" />}
                                </div>
                                <span className={`text-sm font-bold ${
                                  candidate.score >= 80 ? 'text-green-400' :
                                  candidate.score >= 60 ? 'text-blue-400' :
                                  candidate.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {candidate.score}
                                </span>
                              </div>

                              {/* Score Bar */}
                              <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden mb-3">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${getScoreColor(candidate.score)}`}
                                  style={{ width: `${candidate.score}%` }}
                                />
                              </div>

                              {/* Details Row */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                <span>Capacity: {candidate.vehicle.capacityKg} kg</span>
                                <span>Trip Rate: {candidate.driver.tripCompletionRate}%</span>
                                <span>Odometer: {candidate.vehicle.odometer.toLocaleString()} km</span>
                                <span>License: {candidate.driver.licenseCategory}</span>
                              </div>

                              {/* Warnings */}
                              {candidate.warnings.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {candidate.warnings.map((w, i) => (
                                    <span key={i} className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Pair Summary */}
                {selectedCandidate && (
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">Selected</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">
                      {selectedCandidate.vehicle.name} + {selectedCandidate.driver.name} — Score: {selectedCandidate.score}/100
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vehicle Capacity: {selectedCandidate.vehicle.capacityKg} kg · Cargo: {weight} kg · Margin: {selectedCandidate.vehicle.capacityKg - weight} kg
                    </p>
                  </div>
                )}

                {/* Overweight Validation */}
                {isOverweight && (
                  <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/5">
                    <p className="text-sm font-medium text-red-400">
                      Vehicle Capacity: {capacity} kg<br/>
                      Cargo Weight: {weight} kg
                    </p>
                    <p className="text-red-500 font-semibold text-sm mt-2 flex items-center gap-1.5">
                      <X className="w-4 h-4" /> Capacity exceeded by {exceededBy} kg - dispatch blocked
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  disabled={isOverweight || !selectedCandidate || !formData.source || !formData.destination}
                  className="flex-1 bg-secondary/50 hover:bg-secondary/80 text-muted-foreground disabled:opacity-50 disabled:bg-secondary/30 h-12 rounded-lg"
                >
                  Dispatch {isOverweight && "(disabled)"}
                </Button>
                <Button onClick={handleCloseModal} variant="outline" className="flex-1 h-12 border-transparent bg-secondary/30 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
