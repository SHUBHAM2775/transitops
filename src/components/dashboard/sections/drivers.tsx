"use client";

import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;
  contact: string;
  tripCompl: string;
  safety: "Available" | "Suspended" | "On Trip" | "Off Duty";
  status: "Available" | "Suspended" | "On Trip" | "Off Duty";
}

const initialDrivers: Driver[] = [
  {
    id: "1",
    name: "Alex",
    licenseNo: "DL-88213",
    category: "LMV",
    expiry: "12/2028",
    contact: "98765xxxxx",
    tripCompl: "96%",
    safety: "Available",
    status: "Available",
  },
  {
    id: "2",
    name: "John",
    licenseNo: "DL-44120",
    category: "HMV",
    expiry: "03/2025 EXPIRE",
    contact: "98220xxxxx",
    tripCompl: "81%",
    safety: "Suspended",
    status: "Suspended",
  },
  {
    id: "3",
    name: "Priya",
    licenseNo: "DL-77031",
    category: "LMV",
    expiry: "08/2021",
    contact: "99110xxxxx",
    tripCompl: "99%",
    safety: "On Trip",
    status: "On Trip",
  },
  {
    id: "4",
    name: "Suresh",
    licenseNo: "DL-90045",
    category: "HMV",
    expiry: "01/2027",
    contact: "97440xxxxx",
    tripCompl: "88%",
    safety: "Available",
    status: "Off Duty",
  },
];

export function DriversSection() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    category: "LMV",
    safety: "Available",
    status: "Available",
  });

  const handleAddDriver = () => {
    if (!newDriver.name || !newDriver.licenseNo) return;
    
    setDrivers([
      ...drivers,
      {
        id: Math.random().toString(),
        name: newDriver.name,
        licenseNo: newDriver.licenseNo,
        category: newDriver.category || "LMV",
        expiry: newDriver.expiry || "12/2028",
        contact: newDriver.contact || "0000000000",
        tripCompl: newDriver.tripCompl || "0%",
        safety: (newDriver.safety as Driver["safety"]) || "Available",
        status: (newDriver.status as Driver["status"]) || "Available",
      },
    ]);
    setIsAddModalOpen(false);
    setNewDriver({ category: "LMV", safety: "Available", status: "Available" }); // Reset
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.licenseNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBadgeColor = (val: string) => {
    switch (val) {
      case "Available":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "On Trip":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "Suspended":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "Off Duty":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-10 px-4 bg-background border-border">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Status: All</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="On Trip">On Trip</SelectItem>
              <SelectItem value="Off Duty">Off Duty</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search driver or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-background border-border"
            />
          </div>
        </div>

        {/* Add Driver Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5">
              <Plus className="w-4 h-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Driver</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-muted-foreground">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex"
                  className="col-span-3 bg-background"
                  value={newDriver.name || ""}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseNo" className="text-right text-muted-foreground">License No.</Label>
                <Input
                  id="licenseNo"
                  placeholder="e.g. DL-12345"
                  className="col-span-3 bg-background"
                  value={newDriver.licenseNo || ""}
                  onChange={(e) => setNewDriver({ ...newDriver, licenseNo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right text-muted-foreground">Category</Label>
                <div className="col-span-3">
                  <Select 
                    value={newDriver.category} 
                    onValueChange={(val) => setNewDriver({ ...newDriver, category: val })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LMV">LMV</SelectItem>
                      <SelectItem value="HMV">HMV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry" className="text-right text-muted-foreground">Expiry</Label>
                <Input
                  id="expiry"
                  placeholder="e.g. 12/2028"
                  className="col-span-3 bg-background"
                  value={newDriver.expiry || ""}
                  onChange={(e) => setNewDriver({ ...newDriver, expiry: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right text-muted-foreground">Contact</Label>
                <Input
                  id="contact"
                  placeholder="e.g. 98765xxxxx"
                  className="col-span-3 bg-background"
                  value={newDriver.contact || ""}
                  onChange={(e) => setNewDriver({ ...newDriver, contact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tripCompl" className="text-right text-muted-foreground">Trip Compl.</Label>
                <Input
                  id="tripCompl"
                  placeholder="e.g. 96%"
                  className="col-span-3 bg-background"
                  value={newDriver.tripCompl || ""}
                  onChange={(e) => setNewDriver({ ...newDriver, tripCompl: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-muted-foreground">Status</Label>
                <div className="col-span-3">
                  <Select 
                    value={newDriver.status} 
                    onValueChange={(val) => setNewDriver({ ...newDriver, status: val as any, safety: val as any })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="On Trip">On Trip</SelectItem>
                      <SelectItem value="Off Duty">Off Duty</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDriver} className="bg-primary text-primary-foreground">Save Driver</Button>
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
                    Driver
                    <Filter className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">License No.</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Contact
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Trip Compl.
                  </button>
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver, index) => (
                  <tr
                    key={driver.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-foreground">{driver.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-foreground">{driver.licenseNo}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                        {driver.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-muted-foreground">{driver.expiry}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-foreground">{driver.contact}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-foreground">{driver.tripCompl}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md border ${getBadgeColor(driver.safety)}`}>
                        {driver.safety}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-md border ${getBadgeColor(driver.status)}`}>
                        {driver.status}
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Showing {filteredDrivers.length} of {drivers.length} drivers
          </span>
        </div>
      </div>

      {/* Footer Rule Note */}
      <div className="text-sm text-[#EAB308] font-medium opacity-90 mt-4">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </div>
    </div>
  );
}
