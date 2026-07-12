"use client";

import { useState } from "react";
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

interface Vehicle {
  id: string;
  regNo: string;
  nameMode: string;
  type: string;
  capacity: string;
  odometer: number;
  acqCost: number;
  status: "Available" | "On Trip" | "In Shop" | "Retired";
}

const initialVehicles: Vehicle[] = [
  {
    id: "1",
    regNo: "GJ01AB4521",
    nameMode: "VAN-05",
    type: "Van",
    capacity: "500 kg",
    odometer: 74000,
    acqCost: 620000,
    status: "Available",
  },
  {
    id: "2",
    regNo: "GJ01AB9981",
    nameMode: "TRUCK-11",
    type: "Truck",
    capacity: "5 Ton",
    odometer: 182000,
    acqCost: 2450000,
    status: "On Trip",
  },
  {
    id: "3",
    regNo: "GJ01AB1120",
    nameMode: "MINI-03",
    type: "Mini",
    capacity: "1 Ton",
    odometer: 66000,
    acqCost: 410000,
    status: "In Shop",
  },
  {
    id: "4",
    regNo: "GJ01AB0087",
    nameMode: "VAN-09",
    type: "Van",
    capacity: "750 kg",
    odometer: 241900,
    acqCost: 590000,
    status: "Retired",
  },
];

export function FleetSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    type: "Van",
    status: "Available",
  });

  const handleAddVehicle = () => {
    if (!newVehicle.regNo || !newVehicle.nameMode) return;
    
    setVehicles([
      ...vehicles,
      {
        id: Math.random().toString(),
        regNo: newVehicle.regNo,
        nameMode: newVehicle.nameMode,
        type: newVehicle.type || "Van",
        capacity: newVehicle.capacity || "0",
        odometer: Number(newVehicle.odometer) || 0,
        acqCost: Number(newVehicle.acqCost) || 0,
        status: (newVehicle.status as Vehicle["status"]) || "Available",
      },
    ]);
    setIsAddModalOpen(false);
    setNewVehicle({ type: "Van", status: "Available" }); // Reset
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.regNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.nameMode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || v.type === typeFilter;
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-10 px-4 bg-background border-border">
              <SelectValue placeholder="Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Type: All</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Truck">Truck</SelectItem>
              <SelectItem value="Mini">Mini</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 px-4 bg-background border-border">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="In Shop">In Shop</SelectItem>
              <SelectItem value="Retired">Retired</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reg. no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background border-border"
            />
          </div>
        </div>

        {/* Add Vehicle Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Vehicle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="regNo" className="text-right text-muted-foreground">Reg. No.</Label>
                <Input
                  id="regNo"
                  placeholder="e.g. GJ01AB1234"
                  className="col-span-3 bg-background"
                  value={newVehicle.regNo || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, regNo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nameMode" className="text-right text-muted-foreground">Name/Mode</Label>
                <Input
                  id="nameMode"
                  placeholder="e.g. VAN-10"
                  className="col-span-3 bg-background"
                  value={newVehicle.nameMode || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, nameMode: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="capacity" className="text-right text-muted-foreground">Capacity</Label>
                <Input
                  id="capacity"
                  placeholder="e.g. 500 kg"
                  className="col-span-3 bg-background"
                  value={newVehicle.capacity || ""}
                  onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
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
              <div className="grid grid-cols-4 items-center gap-4">
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
              <div className="grid grid-cols-4 items-center gap-4">
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
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Reg. No. (Unique)
                    <Filter className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name/Mode</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Odometer
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Acq. Cost
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {vehicle.regNo.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{vehicle.regNo}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-foreground">{vehicle.nameMode}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                        {vehicle.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{vehicle.capacity}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-foreground">{vehicle.odometer.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-foreground">${vehicle.acqCost.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md border ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </button>
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
