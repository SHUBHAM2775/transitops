"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Vehicle {
  id: string;
  regNo: string;
  nameMode: string;
  type: string;
  capacity: string;
  odometer: number;
  acqCost: number;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
  region: string;
}

// Helper to format capacity in UI (e.g. 500 -> 500 kg, 3000 -> 3 Ton)
const formatCapacity = (capacityKg: number): string => {
  if (capacityKg >= 1000 && capacityKg % 1000 === 0) {
    return `${capacityKg / 1000} Ton`;
  }
  return `${capacityKg} kg`;
};

// Helper to parse capacity string in UI (e.g. "5 Ton" -> 5000, "500 kg" -> 500)
const parseCapacityToKg = (capacityStr: string | undefined): number => {
  if (!capacityStr) return 0;
  const match = capacityStr.match(/^(\d+(?:\.\d+)?)\s*(kg|ton|t)?$/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = (match[2] || "").toLowerCase();
    if (unit === "ton" || unit === "t") {
      return val * 1000;
    }
    return val;
  }
  const parsed = parseFloat(capacityStr);
  return isNaN(parsed) ? 0 : parsed;
};

// Map status from DB value (lowercase) to UI display value (Capitalized)
const mapStatusToUI = (status: string): string => {
  switch (status.toLowerCase()) {
    case "available": return "Available";
    case "on_trip": return "On Trip";
    case "in_shop": return "In Shop";
    case "retired": return "Retired";
    default: return status;
  }
};

// Map status from UI display value to DB value (lowercase)
const mapStatusToDB = (status: string): string => {
  switch (status) {
    case "Available": return "available";
    case "On Trip": return "on_trip";
    case "In Shop": return "in_shop";
    case "Retired": return "retired";
    default: return status.toLowerCase();
  }
};

interface DBVehicle {
  id: string;
  registration_number: string;
  vehicle_name: string;
  vehicle_model: string | null;
  vehicle_type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  region: string | null;
  status: string;
}

export function FleetSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    type: "Van",
    status: "Available",
    region: "",
  });

  const mapDBVehicleToUI = (db: DBVehicle): Vehicle => ({
    id: db.id,
    regNo: db.registration_number,
    nameMode: db.vehicle_model ? `${db.vehicle_name} / ${db.vehicle_model}` : db.vehicle_name,
    type: db.vehicle_type,
    capacity: formatCapacity(db.max_load_capacity),
    odometer: db.odometer,
    acqCost: db.acquisition_cost,
    status: mapStatusToUI(db.status) as any,
    region: db.region || "",
  });

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setVehicles(data.map(mapDBVehicleToUI));
      }
    } catch (err: any) {
      console.error("Error fetching vehicles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();

    // Subscribe to realtime database changes on "vehicles" table
    const channel = supabase
      .channel("fleet-section-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddVehicle = async () => {
    if (!newVehicle.regNo || !newVehicle.nameMode) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const dbVehicle = {
        registration_number: newVehicle.regNo,
        vehicle_name: newVehicle.nameMode,
        vehicle_model: "",
        vehicle_type: newVehicle.type || "Van",
        max_load_capacity: parseCapacityToKg(newVehicle.capacity),
        odometer: Number(newVehicle.odometer) || 0,
        acquisition_cost: Number(newVehicle.acqCost) || 0,
        region: newVehicle.region || null,
        status: mapStatusToDB(newVehicle.status || "Available"),
        created_by: user?.id || null,
      };

      const { error } = await supabase
        .from("vehicles")
        .insert([dbVehicle]);

      if (error) throw error;

      // Update state immediately as fallback for disabled realtime dashboards
      fetchVehicles();

      setIsAddModalOpen(false);
      setNewVehicle({ type: "Van", status: "Available", region: "" });
    } catch (err: any) {
      console.error("Error adding vehicle:", err);
      alert(err.message || "Failed to add vehicle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVehicle = async () => {
    if (!editingVehicle || !editingVehicle.regNo || !editingVehicle.nameMode) return;
    
    setIsLoading(true);
    try {
      const dbVehicle = {
        registration_number: editingVehicle.regNo,
        vehicle_name: editingVehicle.nameMode,
        vehicle_model: "",
        vehicle_type: editingVehicle.type,
        max_load_capacity: parseCapacityToKg(editingVehicle.capacity),
        odometer: Number(editingVehicle.odometer) || 0,
        acquisition_cost: Number(editingVehicle.acqCost) || 0,
        region: editingVehicle.region || null,
        status: mapStatusToDB(editingVehicle.status),
      };

      const { error } = await supabase
        .from("vehicles")
        .update(dbVehicle)
        .eq("id", editingVehicle.id);

      if (error) throw error;

      setEditingVehicle(null);
      fetchVehicles(); // update state immediately!
    } catch (err: any) {
      console.error("Error updating vehicle:", err);
      alert(err.message || "Failed to update vehicle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchVehicles(); // update state immediately!
    } catch (err: any) {
      console.error("Error deleting vehicle:", err);
      alert(err.message || "Failed to delete vehicle");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.regNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesRegion = regionFilter === "All" || v.region === regionFilter;
    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  // Extract unique regions and types from the fetched list
  const uniqueRegions = Array.from(
    new Set(vehicles.map((v) => v.region).filter(Boolean))
  ).sort() as string[];

  const uniqueTypes = Array.from(
    new Set(vehicles.map((v) => v.type).filter(Boolean))
  ).sort() as string[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "On Trip":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "In Shop":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "Retired":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background border-border">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Type: All</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          {/* Region Filter */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[160px] h-10 px-4 bg-background border-border">
              <SelectValue placeholder="Region: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Region: All</SelectItem>
              {uniqueRegions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reg. no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-border"
            />
          </div>
        </div>

        {/* Add Vehicle Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Vehicle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="regNo" className="text-right text-muted-foreground">Reg. No.</Label>
                <Input
                  id="regNo"
                  placeholder="e.g. GJ01AB1234"
                  className="col-span-3 bg-background"
                  value={newVehicle.regNo || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, regNo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="nameMode" className="text-right text-muted-foreground">Name/Mode</Label>
                <Input
                  id="nameMode"
                  placeholder="e.g. VAN-10"
                  className="col-span-3 bg-background"
                  value={newVehicle.nameMode || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, nameMode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right text-muted-foreground">Type</Label>
                <div className="col-span-3">
                  <Select 
                    value={newVehicle.type} 
                    onValueChange={(val) => setNewVehicle({ ...newVehicle, type: val })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Mini">Mini</SelectItem>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="Bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right text-muted-foreground">Capacity</Label>
                <Input
                  id="capacity"
                  placeholder="e.g. 500 kg"
                  className="col-span-3 bg-background"
                  value={newVehicle.capacity || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="odometer" className="text-right text-muted-foreground">Odometer</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="0"
                  className="col-span-3 bg-background"
                  value={newVehicle.odometer || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, odometer: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="acqCost" className="text-right text-muted-foreground">Acq. Cost</Label>
                <Input
                  id="acqCost"
                  type="number"
                  placeholder="0"
                  className="col-span-3 bg-background"
                  value={newVehicle.acqCost || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, acqCost: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right text-muted-foreground">Region</Label>
                <Input
                  id="region"
                  placeholder="e.g. North"
                  className="col-span-3 bg-background"
                  value={newVehicle.region || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, region: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-muted-foreground">Status</Label>
                <div className="col-span-3">
                  <Select 
                    value={newVehicle.status} 
                    onValueChange={(val) => setNewVehicle({ ...newVehicle, status: val as any })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="On Trip">On Trip</SelectItem>
                      <SelectItem value="In Shop">In Shop</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddVehicle} className="bg-primary text-primary-foreground">Save Vehicle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Vehicle Modal */}
        <Dialog open={editingVehicle !== null} onOpenChange={(open) => { if (!open) setEditingVehicle(null); }}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Vehicle</DialogTitle>
            </DialogHeader>
            {editingVehicle && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editRegNo" className="text-right text-muted-foreground">Reg. No.</Label>
                  <Input
                    id="editRegNo"
                    placeholder="e.g. GJ01AB1234"
                    className="col-span-3 bg-background"
                    value={editingVehicle.regNo || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, regNo: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editNameMode" className="text-right text-muted-foreground">Name/Mode</Label>
                  <Input
                    id="editNameMode"
                    placeholder="e.g. VAN-10"
                    className="col-span-3 bg-background"
                    value={editingVehicle.nameMode || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, nameMode: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editType" className="text-right text-muted-foreground">Type</Label>
                  <div className="col-span-3">
                    <Select 
                      value={editingVehicle.type} 
                      onValueChange={(val) => setEditingVehicle({ ...editingVehicle, type: val })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Mini">Mini</SelectItem>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="Bus">Bus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCapacity" className="text-right text-muted-foreground">Capacity</Label>
                  <Input
                    id="editCapacity"
                    placeholder="e.g. 500 kg"
                    className="col-span-3 bg-background"
                    value={editingVehicle.capacity || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editOdometer" className="text-right text-muted-foreground">Odometer</Label>
                  <Input
                    id="editOdometer"
                    type="number"
                    placeholder="0"
                    className="col-span-3 bg-background"
                    value={editingVehicle.odometer || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, odometer: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editAcqCost" className="text-right text-muted-foreground">Acq. Cost</Label>
                  <Input
                    id="editAcqCost"
                    type="number"
                    placeholder="0"
                    className="col-span-3 bg-background"
                    value={editingVehicle.acqCost || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, acqCost: Number(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editRegion" className="text-right text-muted-foreground">Region</Label>
                  <Input
                    id="editRegion"
                    placeholder="e.g. North"
                    className="col-span-3 bg-background"
                    value={editingVehicle.region || ""}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, region: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editStatus" className="text-right text-muted-foreground">Status</Label>
                  <div className="col-span-3">
                    <Select 
                      value={editingVehicle.status} 
                      onValueChange={(val) => setEditingVehicle({ ...editingVehicle, status: val as any })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="On Trip">On Trip</SelectItem>
                        <SelectItem value="In Shop">In Shop</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingVehicle(null)}>Cancel</Button>
              <Button onClick={handleUpdateVehicle} className="bg-primary text-primary-foreground">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Reg. No. (Unique)
                    <Filter className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Name/Mode</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Region</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Capacity</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Odometer
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Acq. Cost
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="w-12 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle, index) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">{vehicle.regNo}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm text-foreground">{vehicle.nameMode}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-secondary text-sm font-medium text-foreground">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">{vehicle.region || "—"}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">{vehicle.capacity}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{vehicle.odometer.toLocaleString()}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">${vehicle.acqCost.toLocaleString()}</span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-md border ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-2 px-6 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border animate-in fade-in slide-in-from-top-2 duration-150">
                          <DropdownMenuItem onClick={() => setEditingVehicle(vehicle)} className="cursor-pointer">
                            Edit Vehicle
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            variant="destructive"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                          >
                            Delete Vehicle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </span>
        </div>
      </div>

      {/* Footer Rule Note */}
      <div className="text-sm text-[#EAB308] font-medium opacity-90 mt-4">
        Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher
      </div>
    </div>
  );
}
