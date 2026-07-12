"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Pencil, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DBDriver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string; // ISO date string e.g. "2028-12-31"
  contact_number: string;
  safety_score: number;
  status: "available" | "on_trip" | "off_duty" | "suspended";
}

interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;          // formatted for display
  isExpired: boolean;
  contact: string;
  tripCompl: number;       // completed trip count from DB
  safety: number;          // safety_score from DB
  status: "Available" | "On Trip" | "Off Duty" | "Suspended";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map DB status (snake_case) → UI display label */
const mapStatusToUI = (status: string): Driver["status"] => {
  switch (status) {
    case "available":  return "Available";
    case "on_trip":    return "On Trip";
    case "off_duty":   return "Off Duty";
    case "suspended":  return "Suspended";
    default:           return "Available";
  }
};

/** Map UI status label → DB value for insert/filter */
const mapStatusToDB = (status: string): string => {
  switch (status) {
    case "Available":  return "available";
    case "On Trip":    return "on_trip";
    case "Off Duty":   return "off_duty";
    case "Suspended":  return "suspended";
    default:           return status.toLowerCase();
  }
};

/** Format an ISO date string to MM/YYYY */
const formatExpiry = (isoDate: string): string => {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${yyyy}`;
};

/** Returns true when the given ISO date is strictly before today */
const isLicenseExpired = (isoDate: string): boolean => {
  if (!isoDate) return false;
  const expiry = new Date(isoDate);
  if (isNaN(expiry.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
};

/** Map a DB row + trip count → UI Driver */
const mapDBDriverToUI = (db: DBDriver, completedTrips: number): Driver => ({
  id: db.id,
  name: db.name,
  licenseNo: db.license_number,
  category: db.license_category,
  expiry: formatExpiry(db.license_expiry),
  isExpired: isLicenseExpired(db.license_expiry),
  contact: db.contact_number,
  tripCompl: completedTrips,
  safety: db.safety_score ?? 0,
  status: mapStatusToUI(db.status),
});

/** Badge classes per status label */
const getBadgeColor = (val: string): string => {
  switch (val) {
    case "Available":  return "bg-green-500/20 text-green-500 border-green-500/30";
    case "On Trip":    return "bg-blue-500/20 text-blue-500 border-blue-500/30";
    case "Suspended":  return "bg-orange-500/20 text-orange-500 border-orange-500/30";
    case "Off Duty":   return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    default:           return "bg-gray-500/20 text-gray-500 border-gray-500/30";
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

// Shared form shape for both Add and Edit
type DriverForm = {
  name: string;
  licenseNo: string;
  category: string;
  expiry: string;
  contact: string;
  status: string;
};

const emptyForm: DriverForm = {
  name: "",
  licenseNo: "",
  category: "LMV",
  expiry: "",
  contact: "",
  status: "available",
};

export function DriversSection() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editForm, setEditForm] = useState<DriverForm>(emptyForm);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Add Driver form state
  const [newDriver, setNewDriver] = useState<DriverForm>(emptyForm);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchDrivers = async () => {
    try {
      setError(null);

      // 1. Fetch all drivers
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("name", { ascending: true });

      if (driversError) throw driversError;
      if (!driversData) {
        setDrivers([]);
        return;
      }

      // 2. Fetch completed trip counts grouped by driver_id
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("driver_id")
        .eq("status", "completed");

      if (tripsError) {
        // Non-fatal: we'll just show 0 for trip counts
        console.warn("Could not fetch trips:", tripsError.message);
      }

      // Build a lookup: driver_id → completed trip count
      const tripCountMap: Record<string, number> = {};
      if (tripsData) {
        for (const row of tripsData) {
          if (row.driver_id) {
            tripCountMap[row.driver_id] = (tripCountMap[row.driver_id] ?? 0) + 1;
          }
        }
      }

      // 3. Map DB rows to UI Driver objects
      const mapped: Driver[] = driversData.map((db: DBDriver) =>
        mapDBDriverToUI(db, tripCountMap[db.id] ?? 0)
      );

      setDrivers(mapped);
    } catch (err: any) {
      console.error("Error fetching drivers:", err);
      setError(err?.message ?? "Failed to load drivers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    // Realtime: re-fetch whenever drivers or trips table changes
    const channel = supabase
      .channel("drivers-section-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => { fetchDrivers(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => { fetchDrivers(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add Driver ─────────────────────────────────────────────────────────────

  const handleAddDriver = async () => {
    if (!newDriver.name || !newDriver.licenseNo) return;

    try {
      const { error: insertError } = await supabase.from("drivers").insert({
        name: newDriver.name,
        license_number: newDriver.licenseNo,
        license_category: newDriver.category,
        license_expiry: newDriver.expiry || null,
        contact_number: newDriver.contact,
        safety_score: 100,
        status: newDriver.status,
      });

      if (insertError) throw insertError;

      setIsAddModalOpen(false);
      setNewDriver(emptyForm);
      // Immediately refresh — don't wait for the realtime event
      fetchDrivers();
    } catch (err: any) {
      console.error("Error adding driver:", err);
      alert("Failed to add driver: " + (err?.message ?? "Unknown error"));
    }
  };

  // ── Edit Driver ────────────────────────────────────────────────────────────

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setEditForm({
      name: driver.name,
      licenseNo: driver.licenseNo,
      category: driver.category,
      // Convert MM/YYYY back to YYYY-MM-DD for the date input
      expiry: (() => {
        // expiry is "MM/YYYY" — convert to "YYYY-MM-01" for the date input
        const [mm, yyyy] = driver.expiry.split("/");
        if (mm && yyyy) return `${yyyy}-${mm.padStart(2, "0")}-01`;
        return "";
      })(),
      contact: driver.contact,
      status: mapStatusToDB(driver.status),
    });
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver || !editForm.name || !editForm.licenseNo) return;

    try {
      const { error: updateError } = await supabase
        .from("drivers")
        .update({
          name: editForm.name,
          license_number: editForm.licenseNo,
          license_category: editForm.category,
          license_expiry: editForm.expiry || null,
          contact_number: editForm.contact,
          status: editForm.status,
        })
        .eq("id", editingDriver.id);

      if (updateError) throw updateError;

      setEditingDriver(null);
      fetchDrivers();
    } catch (err: any) {
      console.error("Error updating driver:", err);
      alert("Failed to update driver: " + (err?.message ?? "Unknown error"));
    }
  };

  // ── Delete Driver ──────────────────────────────────────────────────────────

  const handleDeleteDriver = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      const { error: deleteError } = await supabase
        .from("drivers")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      fetchDrivers();
    } catch (err: any) {
      console.error("Error deleting driver:", err);
      alert("Failed to delete driver: " + (err?.message ?? "Unknown error"));
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.licenseNo.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border">
              <SelectValue placeholder="Status" />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search driver or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-border"
            />
          </div>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full md:w-auto">
              <Plus className="w-4 h-4" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Driver</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-muted-foreground">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex"
                  className="col-span-3 bg-background"
                  value={newDriver.name}
                  onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="licenseNo" className="text-right text-muted-foreground">License No.</Label>
                <Input
                  id="licenseNo"
                  placeholder="e.g. DL-12345"
                  className="col-span-3 bg-background"
                  value={newDriver.licenseNo}
                  onChange={(e) => setNewDriver({ ...newDriver, licenseNo: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="expiry" className="text-right text-muted-foreground">Expiry</Label>
                <Input
                  id="expiry"
                  type="date"
                  className="col-span-3 bg-background"
                  value={newDriver.expiry}
                  onChange={(e) => setNewDriver({ ...newDriver, expiry: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right text-muted-foreground">Contact</Label>
                <Input
                  id="contact"
                  placeholder="e.g. 98765xxxxx"
                  className="col-span-3 bg-background"
                  value={newDriver.contact}
                  onChange={(e) => setNewDriver({ ...newDriver, contact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right text-muted-foreground">Status</Label>
                <div className="col-span-3">
                  <Select
                    value={newDriver.status}
                    onValueChange={(val) => setNewDriver({ ...newDriver, status: val })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="on_trip">On Trip</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
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
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Driver
                    <Filter className="w-3 h-3 opacity-50" />
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">License No.</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Expiry</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Contact
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Trip Compl.
                  </button>
                </th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Safety</th>
                <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="w-12 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {/* Loading state */}
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4 text-muted-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Loading drivers…
                    </div>
                  </td>
                </tr>

              /* Error state */
              ) : error ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-red-500">
                    {error}
                  </td>
                </tr>

              /* Empty state */
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No drivers found.
                  </td>
                </tr>

              /* Data rows */
              ) : (
                filteredDrivers.map((driver, index) => (
                  <tr
                    key={driver.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    {/* Driver name */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">{driver.name}</span>
                    </td>

                    {/* License number */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm text-foreground">{driver.licenseNo}</span>
                    </td>

                    {/* Category */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-secondary text-sm font-medium text-foreground">
                        {driver.category}
                      </span>
                    </td>

                    {/* Expiry — show EXPIRE badge when past today */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      {driver.isExpired ? (
                        <span className="text-sm text-muted-foreground">
                          {driver.expiry}{" "}
                          <span className="ml-1 px-1 py-0.5 text-xs font-bold rounded bg-red-500/20 text-red-500 border border-red-500/30">
                            EXPIRE
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{driver.expiry}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{driver.contact}</span>
                    </td>

                    {/* Trip Completions — live count from trips table */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{driver.tripCompl}</span>
                    </td>

                    {/* Safety score — numeric from drivers.safety_score */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{driver.safety}%</span>
                    </td>

                    {/* Status badge */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 text-sm font-semibold rounded-md border ${getBadgeColor(driver.status)}`}
                      >
                        {driver.status}
                      </span>
                    </td>

                    {/* Actions menu */}
                    <td className="py-2 px-6 whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-4 h-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => openEditModal(driver)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-500 focus:text-red-500"
                            onClick={() => handleDeleteDriver(driver.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
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

      {/* Edit Driver Modal */}
      <Dialog open={!!editingDriver} onOpenChange={(open) => { if (!open) setEditingDriver(null); }}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Driver</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right text-muted-foreground">Name</Label>
              <Input
                id="edit-name"
                className="col-span-3 bg-background"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-licenseNo" className="text-right text-muted-foreground">License No.</Label>
              <Input
                id="edit-licenseNo"
                className="col-span-3 bg-background"
                value={editForm.licenseNo}
                onChange={(e) => setEditForm({ ...editForm, licenseNo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right text-muted-foreground">Category</Label>
              <div className="col-span-3">
                <Select
                  value={editForm.category}
                  onValueChange={(val) => setEditForm({ ...editForm, category: val })}
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
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expiry" className="text-right text-muted-foreground">Expiry</Label>
              <Input
                id="edit-expiry"
                type="date"
                className="col-span-3 bg-background"
                value={editForm.expiry}
                onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contact" className="text-right text-muted-foreground">Contact</Label>
              <Input
                id="edit-contact"
                className="col-span-3 bg-background"
                value={editForm.contact}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right text-muted-foreground">Status</Label>
              <div className="col-span-3">
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_trip">On Trip</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDriver(null)}>Cancel</Button>
            <Button onClick={handleUpdateDriver} className="bg-primary text-primary-foreground">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
