"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Trash2, Star, AlertTriangle, CheckCircle2, Loader2, AlertCircle, Search } from "lucide-react";
import {
  type DispatchVehicle,
  type DispatchDriver,
  type ScoredCandidate,
  rankCandidates,
} from "@/lib/dispatch-engine";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";

interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  vehicle: string;
  driverId: string | null;
  driver: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  remarks: string | null;
  completedAt: string | null;
  actualStart: string | null;
}

interface DBTrip {
  id: string;
  trip_number: string;
  source: string;
  destination: string;
  vehicle_id: string | null;
  driver_id: string | null;
  cargo_weight: number | null;
  planned_distance: number | null;
  status: string;
  remarks: string | null;
  dispatcher_id: string | null;
  completed_at: string | null;
  actual_start: string | null;
  created_at: string;
  vehicles?: { vehicle_name: string; max_load_capacity: number } | null;
  drivers?: { name: string } | null;
}

interface DBVehicle {
  id: string;
  vehicle_name: string;
  vehicle_type: string;
  max_load_capacity: number;
  odometer: number;
  status: string;
  region: string | null;
}

interface DBDriver {
  id: string;
  name: string;
  category: string;
  license_expiry: string;
  safety_score: number | string;
  status: string;
}

// ─── Status Mapping Helpers ───────────────────────────────────────────────────

const mapStatusToUI = (status: string): TripStatus => {
  switch (status?.toLowerCase()) {
    case "draft": return "Draft";
    case "dispatched": return "Dispatched";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    default: return "Draft";
  }
};

const mapVehicleStatusToEngine = (status: string): DispatchVehicle["status"] => {
  switch (status?.toLowerCase()) {
    case "available": return "Available";
    case "on_trip": return "On Trip";
    case "in_shop": return "In Shop";
    case "retired": return "Retired";
    default: return "Available";
  }
};

const mapDriverStatusToEngine = (status: string): DispatchDriver["status"] => {
  switch (status?.toLowerCase()) {
    case "available": return "Available";
    case "on_trip": return "On Trip";
    case "off_duty": return "Off Duty";
    case "suspended": return "Suspended";
    default: return "Available";
  }
};

const formatExpiryToEngine = (isoDate: string): string => {
  if (!isoDate) return "01/2030";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "01/2030";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
};

const mapDBTripToUI = (db: DBTrip): Trip => ({
  id: db.id,
  tripNumber: db.trip_number,
  source: db.source,
  destination: db.destination,
  vehicleId: db.vehicle_id,
  vehicle: db.vehicles?.vehicle_name ?? "Unassigned",
  driverId: db.driver_id,
  driver: db.drivers?.name ?? "Unassigned",
  cargoWeight: db.cargo_weight ?? 0,
  plannedDistance: db.planned_distance ?? 0,
  status: mapStatusToUI(db.status),
  remarks: db.remarks,
  completedAt: db.completed_at,
  actualStart: db.actual_start,
});

// ─── Component ──────────────────────────────────────────────

export function TripsSection() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<DBVehicle[]>([]);
  const [drivers, setDrivers] = useState<DBDriver[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Trip>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<ScoredCandidate | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async () => {
    try {
      setError(null);
      const { data, error: err } = await supabase
        .from("trips")
        .select(`
          *,
          vehicles ( vehicle_name, max_load_capacity ),
          drivers ( name )
        `)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setTrips((data ?? []).map(mapDBTripToUI));
    } catch (e: any) {
      console.error("Error fetching trips:", e);
      setError(e?.message ?? "Failed to load trips.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    const { data } = await supabase.from("vehicles").select("*");
    setVehicles(data ?? []);
  }, []);

  const fetchDrivers = useCallback(async () => {
    const { data } = await supabase.from("drivers").select("*");
    setDrivers(data ?? []);
  }, []);

  useEffect(() => {
    fetchTrips();
    fetchVehicles();
    fetchDrivers();

    const channel = supabase
      .channel("trips-engine-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        fetchTrips();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        fetchVehicles();
        fetchTrips();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        fetchDrivers();
        fetchTrips();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTrips, fetchVehicles, fetchDrivers]);

  // ─── Recommendation Engine Setup ────────────────────────────────────────────

  const engineVehicles: DispatchVehicle[] = useMemo(() => {
    return vehicles.map(v => ({
      id: v.id,
      name: v.vehicle_name,
      type: v.vehicle_type,
      capacityKg: v.max_load_capacity,
      odometer: v.odometer || 0,
      status: mapVehicleStatusToEngine(v.status),
      region: v.region || "",
    }));
  }, [vehicles]);

  const engineDrivers: DispatchDriver[] = useMemo(() => {
    return drivers.map(d => ({
      id: d.id,
      name: d.name,
      licenseCategory: d.category,
      licenseExpiry: formatExpiryToEngine(d.license_expiry),
      tripCompletionRate: Number(d.safety_score) || 100,
      status: mapDriverStatusToEngine(d.status),
    }));
  }, [drivers]);

  // Recommendation engine
  const recommendations = useMemo(() => {
    const weight = formData.cargoWeight || 0;
    const dist = formData.plannedDistance || 0;
    if (weight <= 0) return [];
    return rankCandidates(engineVehicles, engineDrivers, {
      cargoWeightKg: weight,
      plannedDistanceKm: dist,
    });
  }, [formData.cargoWeight, formData.plannedDistance, engineVehicles, engineDrivers]);

  // ─── Trip Number Generation ─────────────────────────────────────────────────

  const generateTripNumber = async (): Promise<string> => {
    const { data } = await supabase
      .from("trips")
      .select("trip_number")
      .order("created_at", { ascending: false });

    const existingNumbers = new Set((data ?? []).map((r: any) => r.trip_number));

    let index = (data?.length ?? 0) + 1;
    let candidate = `TRIP-${String(index).padStart(3, "0")}`;
    while (existingNumbers.has(candidate)) {
      index++;
      candidate = `TRIP-${String(index).padStart(3, "0")}`;
    }
    return candidate;
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleTripClick = (trip: Trip) => {
    setIsCreating(false);
    setFormData(trip);
    setSelectedCandidate(null);
    setFormError(null);
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
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setSelectedCandidate(null);
    setFormError(null);
  };

  const handleSelectCandidate = (candidate: ScoredCandidate) => {
    setSelectedCandidate(candidate);
    setFormData(prev => ({
      ...prev,
      vehicleId: candidate.vehicle.id,
      vehicle: candidate.vehicle.name,
      driverId: candidate.driver.id,
      driver: candidate.driver.name,
    }));
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrips(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    try {
      const { error: err } = await supabase
        .from("trips")
        .delete()
        .in("id", selectedTrips);
      if (err) throw err;
      setSelectedTrips([]);
      fetchTrips();
    } catch (e: any) {
      console.error("Error deleting trips:", e);
    }
  };

  const handleDispatch = async () => {
    if (!formData.source || !formData.destination || !formData.vehicleId || !formData.driverId) {
      setFormError("Source, Destination, and a Recommended Pair are required to dispatch.");
      return;
    }
    if (isOverweight) {
      setFormError("Cargo weight exceeds vehicle capacity.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (isCreating) {
        const tripNumber = await generateTripNumber();
        const { error: insertError } = await supabase.from("trips").insert({
          trip_number: tripNumber,
          source: formData.source,
          destination: formData.destination,
          vehicle_id: formData.vehicleId,
          driver_id: formData.driverId,
          cargo_weight: formData.cargoWeight || null,
          planned_distance: formData.plannedDistance || null,
          status: "dispatched",
          dispatcher_id: user?.id ?? null,
          actual_start: new Date().toISOString(),
        });
        if (insertError) throw insertError;
      } else if (formData.id) {
        const { error: updateError } = await supabase
          .from("trips")
          .update({
            source: formData.source,
            destination: formData.destination,
            vehicle_id: formData.vehicleId,
            driver_id: formData.driverId,
            cargo_weight: formData.cargoWeight || null,
            planned_distance: formData.plannedDistance || null,
            status: "dispatched",
            dispatcher_id: user?.id ?? null,
            actual_start: formData.actualStart ?? new Date().toISOString(),
          })
          .eq("id", formData.id);
        if (updateError) throw updateError;
      }

      // Update vehicle status -> on_trip
      await supabase
        .from("vehicles")
        .update({ status: "on_trip" })
        .eq("id", formData.vehicleId);

      // Update driver status -> on_trip
      await supabase
        .from("drivers")
        .update({ status: "on_trip" })
        .eq("id", formData.driverId);

      fetchTrips();
      handleCloseModal();
    } catch (e: any) {
      setFormError(e?.message ?? "Failed to dispatch.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteTrip = async (trip: Trip) => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      const { error: tErr } = await supabase
        .from("trips")
        .update({
          status: "completed",
          completed_at: now,
          actual_start: trip.actualStart ?? now,
          remarks: formData.remarks || null,
        })
        .eq("id", trip.id);
      if (tErr) throw tErr;

      // Restore vehicle to available (unless retired)
      if (trip.vehicleId) {
        const { data: vData } = await supabase
          .from("vehicles")
          .select("status")
          .eq("id", trip.vehicleId)
          .single();
        if (vData && vData.status !== "retired") {
          await supabase
            .from("vehicles")
            .update({ status: "available" })
            .eq("id", trip.vehicleId);
        }
      }

      // Restore driver to available
      if (trip.driverId) {
        await supabase
          .from("drivers")
          .update({ status: "available" })
          .eq("id", trip.driverId);
      }

      fetchTrips();
      handleCloseModal();
    } catch (e: any) {
      setFormError(e?.message ?? "Failed to complete trip.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTrip = async (trip: Trip) => {
    setIsSaving(true);
    try {
      const { error: tErr } = await supabase
        .from("trips")
        .update({ status: "cancelled" })
        .eq("id", trip.id);
      if (tErr) throw tErr;

      // Restore vehicle status (unless retired)
      if (trip.vehicleId) {
        const { data: vData } = await supabase
          .from("vehicles")
          .select("status")
          .eq("id", trip.vehicleId)
          .single();
        if (vData && vData.status !== "retired") {
          await supabase
            .from("vehicles")
            .update({ status: "available" })
            .eq("id", trip.vehicleId);
        }
      }

      // Restore driver status
      if (trip.driverId) {
        await supabase
          .from("drivers")
          .update({ status: "available" })
          .eq("id", trip.driverId);
      }

      fetchTrips();
      handleCloseModal();
    } catch (e: any) {
      setFormError(e?.message ?? "Failed to cancel trip.");
    } finally {
      setIsSaving(false);
    }
  };

  // Validation (uses selected candidate's vehicle if available)
  const activeVehicle = selectedCandidate?.vehicle;
  const currentVehicleObj = vehicles.find(v => v.id === formData.vehicleId);
  const capacity = activeVehicle
    ? activeVehicle.capacityKg
    : (currentVehicleObj?.max_load_capacity ?? 0);
  const weight = formData.cargoWeight || 0;
  const isOverweight = capacity > 0 ? weight > capacity : false;
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

  // ─── Search filtering ─────────────────────────────────────

  const filteredTrips = trips.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.tripNumber?.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.vehicle.toLowerCase().includes(q) ||
      t.driver.toLowerCase().includes(q)
    );
  });

  const isEditable = isCreating || formData.status === "Draft";

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 flex flex-col space-y-6">

      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search trips..."
            className="bg-transparent border-border h-10 pl-9 text-sm rounded-lg focus-visible:ring-1"
          />
        </div>

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTrips.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            {searchQuery ? "No trips match your search." : "No trips yet. Create your first trip."}
          </p>
        </div>
      )}

      {/* Grid of Trips */}
      {!isLoading && !error && filteredTrips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
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
                  <span className="text-sm font-semibold text-muted-foreground">{trip.tripNumber}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {trip.vehicle} / {trip.driver}
                  </span>
                </div>
                <p className="text-base text-foreground mb-6 font-medium">
                  {trip.source} {'→'} {trip.destination}
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
                  <span className="text-xs font-medium text-muted-foreground">
                    {trip.plannedDistance ? `${trip.plannedDistance} km` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-border/20 text-center sm:text-left">
        <p className="text-xs text-muted-foreground font-medium">
          On Complete: odometer -{">"} fuel log -{">"} expenses -{">"} Vehicle &amp; Driver Available
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
              {isCreating ? "Create New Trip" : `Trip Details — ${formData.tripNumber ?? ""}`}
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
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Destination</Label>
                    <Input
                      value={formData.destination || ""}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. Ahmedabad Hub"
                      disabled={!isEditable}
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
                        const val = e.target.value === "" ? 0 : Number(e.target.value);
                        setFormData({...formData, cargoWeight: val, vehicle: "", driver: "", vehicleId: null, driverId: null});
                        setSelectedCandidate(null);
                      }}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. 450"
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Planned Distance (km)</Label>
                    <Input
                      type="number"
                      value={formData.plannedDistance || ""}
                      onChange={(e) => setFormData({...formData, plannedDistance: e.target.value === "" ? 0 : Number(e.target.value)})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1"
                      placeholder="e.g. 38"
                      disabled={!isEditable}
                    />
                  </div>
                </div>

                {/* ─── Recommendation Engine Results ───────── */}
                {isEditable && (formData.cargoWeight || 0) > 0 && (
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
                {(selectedCandidate || formData.vehicle) && (
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                        {selectedCandidate ? "Selected" : "Assigned"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-medium">
                      {selectedCandidate
                        ? `${selectedCandidate.vehicle.name} + ${selectedCandidate.driver.name} — Score: ${selectedCandidate.score}/100`
                        : `${formData.vehicle} + ${formData.driver}`
                      }
                    </p>
                    {selectedCandidate ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Vehicle Capacity: {selectedCandidate.vehicle.capacityKg} kg · Cargo: {weight} kg · Margin: {selectedCandidate.vehicle.capacityKg - weight} kg
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cargo Weight: {weight} kg · Planned Distance: {formData.plannedDistance} km
                      </p>
                    )}
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

                {/* Error Box */}
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium">{formError}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                {/* Dispatch button: only visible if isEditable (Creating or Draft) */}
                {isEditable && (
                  <Button
                    onClick={handleDispatch}
                    disabled={isSaving || isOverweight || (!selectedCandidate && !formData.vehicleId) || !formData.source || !formData.destination}
                    className="flex-1 bg-secondary/50 hover:bg-secondary/80 text-muted-foreground disabled:opacity-50 disabled:bg-secondary/30 h-12 rounded-lg"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Dispatch {isOverweight ? "(disabled)" : ""}
                  </Button>
                )}

                {/* Complete Trip button: only visible if status is Dispatched */}
                {formData.status === "Dispatched" && (
                  <Button
                    onClick={() => formData.id && handleCompleteTrip(formData as Trip)}
                    disabled={isSaving}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-black font-semibold h-12 rounded-lg"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Complete Trip
                  </Button>
                )}

                {/* Cancel Trip button: visible if status is Dispatched or Draft (and not creating) */}
                {!isCreating && (formData.status === "Dispatched" || formData.status === "Draft") && (
                  <Button
                    onClick={() => formData.id && handleCancelTrip(formData as Trip)}
                    disabled={isSaving}
                    variant="outline"
                    className="flex-1 h-12 border-transparent bg-secondary/30 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Cancel Trip
                  </Button>
                )}

                {/* Cancel button: visible when creating or editing draft */}
                {isEditable && (
                  <Button onClick={handleCloseModal} variant="outline" className="flex-1 h-12 border-transparent bg-secondary/30 text-muted-foreground hover:text-foreground rounded-lg">
                    Cancel
                  </Button>
                )}

                {/* Close button: visible when not editable and not dispatched */}
                {!isEditable && formData.status !== "Dispatched" && (
                  <Button onClick={handleCloseModal} variant="outline" className="flex-1 h-12 border-transparent bg-secondary/30 text-muted-foreground hover:text-foreground rounded-lg">
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
