"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Trash2 } from "lucide-react";

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

const initialTrips: Trip[] = [
  { id: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub", vehicle: "VAN-05", driver: "ALEX", cargoWeight: 450, plannedDistance: 38, status: "Dispatched", eta: "45 min" },
  { id: "TR004", source: "Vatva Industrial Area", destination: "Sanand Warehouse", vehicle: "TRUCK-04", driver: "SURESH", cargoWeight: 200, plannedDistance: 55, status: "Draft", eta: "Awaiting driver" },
  { id: "TR006", source: "Mansa", destination: "Kalol Depot", vehicle: "Unassigned", driver: "Unassigned", cargoWeight: 0, plannedDistance: 25, status: "Cancelled", eta: "Vehicle went to shop" },
];

const mockVehicles = [
  { id: "VAN-05", name: "VAN-05", capacity: 500 },
  { id: "TRUCK-04", name: "TRUCK-04", capacity: 2000 },
];

export function TripsSection() {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Trip>>({});

  const handleTripClick = (trip: Trip) => {
    setIsCreating(false);
    setFormData(trip);
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
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

  // Validation
  const selectedVehicleObj = mockVehicles.find(v => formData.vehicle?.includes(v.id));
  const capacity = selectedVehicleObj ? selectedVehicleObj.capacity : (formData.vehicle?.includes("VAN") ? 500 : 2000);
  const weight = formData.cargoWeight || 0;
  const isOverweight = weight > capacity;
  const exceededBy = weight - capacity;

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
            const isCancelled = step === "Cancelled" && status === "Cancelled";
            
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
            } else if (isCancelled) {
              circleColor = "bg-secondary";
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

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 flex flex-col space-y-6">
      
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        {/* Title removed per request */}
        
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

      {/* Modal for Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[600px] bg-[#020204] border-border/50 p-0 overflow-hidden shadow-2xl"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Vehicle (Available Only)</Label>
                    <Input 
                      value={formData.vehicle || ""} 
                      onChange={(e) => setFormData({...formData, vehicle: e.target.value})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1" 
                      placeholder="e.g. VAN-05 - 500 kg capacity" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Driver (Available Only)</Label>
                    <Input 
                      value={formData.driver || ""} 
                      onChange={(e) => setFormData({...formData, driver: e.target.value})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1" 
                      placeholder="e.g. Alex" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground tracking-widest">Cargo Weight (kg)</Label>
                    <Input 
                      type="number"
                      value={formData.cargoWeight || ""} 
                      onChange={(e) => setFormData({...formData, cargoWeight: Number(e.target.value)})}
                      className="bg-transparent border-border h-11 text-sm rounded-lg focus-visible:ring-1" 
                      placeholder="e.g. 700" 
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

                {/* Validation Box */}
                {formData.vehicle && (
                  <div className={`mt-2 p-4 rounded-xl border ${isOverweight ? 'border-red-500/50 bg-red-500/5' : 'border-border/50'}`}>
                    <p className={`text-sm font-medium ${isOverweight ? 'text-red-400' : 'text-muted-foreground'}`}>
                      Vehicle Capacity: {capacity} kg<br/>
                      Cargo Weight: {weight} kg
                    </p>
                    {isOverweight && (
                      <p className="text-red-500 font-semibold text-sm mt-2 flex items-center gap-1.5">
                        <X className="w-4 h-4" /> Capacity exceeded by {exceededBy} kg - dispatch blocked
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  disabled={isOverweight || !formData.vehicle || !formData.source || !formData.destination} 
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
