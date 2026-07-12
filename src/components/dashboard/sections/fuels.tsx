"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface DBVehicle {
  id: string;
  vehicle_name: string;
  registration_number: string;
}

interface DBDriver {
  id: string;
  name: string;
}

interface DBTrip {
  id: string;
  trip_number: string;
  vehicle_id: string | null;
  driver_id: string | null;
}

interface DBFuelLog {
  id: string;
  trip_id: string;
  vehicle_id: string;
  driver_id: string;
  liters: number;
  cost: number;
  fuel_station: string;
  fuel_date: string;
  created_by: string | null;
  created_at: string;
  vehicles?: DBVehicle | null;
  drivers?: DBDriver | null;
  trips?: DBTrip | null;
}

interface DBExpense {
  id: string;
  trip_id: string;
  vehicle_id: string;
  expense_type: string;
  amount: number;
  expense_date: string;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  vehicles?: DBVehicle | null;
  trips?: DBTrip | null;
}

export function FuelsSection() {
  // Lists from DB
  const [fuelLogs, setFuelLogs] = useState<DBFuelLog[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [tripsList, setTripsList] = useState<DBTrip[]>([]);
  const [vehiclesList, setVehiclesList] = useState<DBVehicle[]>([]);
  const [driversList, setDriversList] = useState<DBDriver[]>([]);

  // Totals states
  const [fuelTotal, setFuelTotal] = useState<number>(0);
  const [maintTotal, setMaintTotal] = useState<number>(0);
  const [expenseTotal, setExpenseTotal] = useState<number>(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [tripFilter, setTripFilter] = useState("All");
  const [driverFilter, setDriverFilter] = useState("All");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Edit states
  const [editingFuelLog, setEditingFuelLog] = useState<DBFuelLog | null>(null);
  const [editingExpense, setEditingExpense] = useState<DBExpense | null>(null);

  // Form states
  const [newFuelLog, setNewFuelLog] = useState<Partial<DBFuelLog>>({});
  const [newExpense, setNewExpense] = useState<Partial<DBExpense>>({});

  // Error/loading states
  const [fuelError, setFuelError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper search functions
  const searchVehicles = async (query: string) => {
    const { data } = await supabase
      .from("vehicles")
      .select("id")
      .or(`vehicle_name.ilike.%${query}%,registration_number.ilike.%${query}%`);
    return data?.map((v: any) => v.id) || [];
  };

  const searchDrivers = async (query: string) => {
    const { data } = await supabase
      .from("drivers")
      .select("id")
      .ilike("name", `%${query}%`);
    return data?.map((d: any) => d.id) || [];
  };

  const searchTrips = async (query: string) => {
    const { data } = await supabase
      .from("trips")
      .select("id")
      .ilike("trip_number", `%${query}%`);
    return data?.map((t: any) => t.id) || [];
  };

  // Fetch filtered lists
  const fetchFuelLogs = useCallback(async () => {
    try {
      let query = supabase
        .from("fuel_logs")
        .select(`
          id,
          trip_id,
          vehicle_id,
          driver_id,
          liters,
          cost,
          fuel_station,
          fuel_date,
          created_by,
          created_at,
          vehicles ( id, vehicle_name, registration_number ),
          drivers ( id, name ),
          trips ( id, trip_number )
        `);

      if (vehicleFilter && vehicleFilter !== "All") {
        query = query.eq("vehicle_id", vehicleFilter);
      }
      if (tripFilter && tripFilter !== "All") {
        query = query.eq("trip_id", tripFilter);
      }
      if (driverFilter && driverFilter !== "All") {
        query = query.eq("driver_id", driverFilter);
      }
      if (startDate) {
        query = query.gte("fuel_date", startDate);
      }
      if (endDate) {
        query = query.lte("fuel_date", endDate);
      }

      if (searchQuery) {
        const [vIds, dIds, tIds] = await Promise.all([
          searchVehicles(searchQuery),
          searchDrivers(searchQuery),
          searchTrips(searchQuery),
        ]);

        const orParts = [`fuel_station.ilike.%${searchQuery}%`];
        if (vIds.length > 0) orParts.push(`vehicle_id.in.(${vIds.join(",")})`);
        if (dIds.length > 0) orParts.push(`driver_id.in.(${dIds.join(",")})`);
        if (tIds.length > 0) orParts.push(`trip_id.in.(${tIds.join(",")})`);

        query = query.or(orParts.join(","));
      }

      const { data, error } = await query.order("fuel_date", { ascending: false });
      if (error) throw error;
      setFuelLogs((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching fuel logs:", err);
    }
  }, [vehicleFilter, tripFilter, driverFilter, startDate, endDate, searchQuery]);

  const fetchExpenses = useCallback(async () => {
    try {
      let query = supabase
        .from("expenses")
        .select(`
          id,
          trip_id,
          vehicle_id,
          expense_type,
          amount,
          expense_date,
          remarks,
          created_by,
          created_at,
          vehicles ( id, vehicle_name, registration_number ),
          trips ( id, trip_number )
        `);

      if (vehicleFilter && vehicleFilter !== "All") {
        query = query.eq("vehicle_id", vehicleFilter);
      }
      if (tripFilter && tripFilter !== "All") {
        query = query.eq("trip_id", tripFilter);
      }
      if (expenseTypeFilter && expenseTypeFilter !== "All") {
        query = query.eq("expense_type", expenseTypeFilter);
      }
      if (startDate) {
        query = query.gte("expense_date", startDate);
      }
      if (endDate) {
        query = query.lte("expense_date", endDate);
      }

      if (searchQuery) {
        const [vIds, tIds] = await Promise.all([
          searchVehicles(searchQuery),
          searchTrips(searchQuery),
        ]);

        const orParts = [
          `expense_type.ilike.%${searchQuery}%`,
          `remarks.ilike.%${searchQuery}%`,
        ];
        if (vIds.length > 0) orParts.push(`vehicle_id.in.(${vIds.join(",")})`);
        if (tIds.length > 0) orParts.push(`trip_id.in.(${tIds.join(",")})`);

        query = query.or(orParts.join(","));
      }

      const { data, error } = await query.order("expense_date", { ascending: false });
      if (error) throw error;
      setExpenses((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  }, [vehicleFilter, tripFilter, expenseTypeFilter, startDate, endDate, searchQuery]);

  const fetchTotals = useCallback(async () => {
    try {
      const [fuelRes, expenseRes, maintRes] = await Promise.all([
        supabase.from("fuel_logs").select("cost"),
        supabase.from("expenses").select("amount"),
        supabase.from("maintenance").select("cost").in("status", ["open", "closed"]),
      ]);

      const fSum = (fuelRes.data || []).reduce((acc: number, log: any) => acc + (Number(log.cost) || 0), 0);
      const eSum = (expenseRes.data || []).reduce((acc: number, exp: any) => acc + (Number(exp.amount) || 0), 0);
      const mSum = (maintRes.data || []).reduce((acc: number, mnt: any) => acc + (Number(mnt.cost) || 0), 0);

      setFuelTotal(fSum);
      setExpenseTotal(eSum);
      setMaintTotal(mSum);
    } catch (err) {
      console.error("Error fetching totals:", err);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        supabase.from("trips").select("id, trip_number, vehicle_id, driver_id"),
        supabase.from("vehicles").select("id, vehicle_name, registration_number"),
        supabase.from("drivers").select("id, name"),
      ]);

      setTripsList(tripsRes.data || []);
      setVehiclesList(vehiclesRes.data || []);
      setDriversList(driversRes.data || []);
    } catch (err) {
      console.error("Error fetching form metadata:", err);
    }
  }, []);

  // Set default values when opening modals
  const handleOpenFuelModal = (isOpen: boolean) => {
    setIsFuelModalOpen(isOpen);
    if (isOpen) {
      setFuelError(null);
      if (!editingFuelLog) {
        setNewFuelLog({
          fuel_date: new Date().toISOString().split("T")[0],
          fuel_station: "",
          liters: undefined,
          cost: undefined,
          trip_id: "",
          vehicle_id: "",
          driver_id: "",
        });
      }
    } else {
      setEditingFuelLog(null);
      setNewFuelLog({});
    }
  };

  const handleOpenExpenseModal = (isOpen: boolean) => {
    setIsExpenseModalOpen(isOpen);
    if (isOpen) {
      setExpenseError(null);
      if (!editingExpense) {
        setNewExpense({
          expense_date: new Date().toISOString().split("T")[0],
          expense_type: "",
          amount: undefined,
          remarks: "",
          trip_id: "",
          vehicle_id: "",
        });
      }
    } else {
      setEditingExpense(null);
      setNewExpense({});
    }
  };

  // Synchronized dropdown logic
  const handleFuelTripChange = (tripId: string) => {
    const selectedTrip = tripsList.find((t) => t.id === tripId);
    setNewFuelLog((prev) => ({
      ...prev,
      trip_id: tripId,
      vehicle_id: selectedTrip?.vehicle_id || prev.vehicle_id || "",
      driver_id: selectedTrip?.driver_id || prev.driver_id || "",
    }));
  };

  const handleExpenseTripChange = (tripId: string) => {
    const selectedTrip = tripsList.find((t) => t.id === tripId);
    setNewExpense((prev) => ({
      ...prev,
      trip_id: tripId,
      vehicle_id: selectedTrip?.vehicle_id || prev.vehicle_id || "",
    }));
  };

  // Initialize and subscribe
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchFuelLogs(), fetchExpenses(), fetchTotals(), fetchMetadata()]);
      setIsLoading(false);
    };

    loadAll();

    const channel = supabase
      .channel("fuels-section-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "fuel_logs" }, () => {
        fetchFuelLogs();
        fetchTotals();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => {
        fetchExpenses();
        fetchTotals();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance" }, () => {
        fetchTotals();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        fetchMetadata();
        fetchFuelLogs();
        fetchExpenses();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        fetchMetadata();
        fetchFuelLogs();
        fetchExpenses();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        fetchMetadata();
        fetchFuelLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFuelLogs, fetchExpenses, fetchTotals, fetchMetadata]);

  // Save Operations
  const handleLogFuel = async () => {
    setFuelError(null);
    if (!newFuelLog.trip_id) return setFuelError("Trip is required");
    if (!newFuelLog.vehicle_id) return setFuelError("Vehicle is required");
    if (!newFuelLog.driver_id) return setFuelError("Driver is required");
    if (!newFuelLog.liters || Number(newFuelLog.liters) <= 0) {
      return setFuelError("Liters must be greater than 0");
    }
    if (!newFuelLog.cost || Number(newFuelLog.cost) <= 0) {
      return setFuelError("Fuel Cost must be greater than 0");
    }
    if (!newFuelLog.fuel_date) return setFuelError("Fuel Date is required");
    if (!newFuelLog.fuel_station) return setFuelError("Fuel Station is required");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        trip_id: newFuelLog.trip_id,
        vehicle_id: newFuelLog.vehicle_id,
        driver_id: newFuelLog.driver_id,
        fuel_station: newFuelLog.fuel_station,
        liters: Number(newFuelLog.liters),
        cost: Number(newFuelLog.cost),
        fuel_date: newFuelLog.fuel_date,
        created_by: user?.id || null,
      };

      if (editingFuelLog) {
        const { error } = await supabase
          .from("fuel_logs")
          .update(payload)
          .eq("id", editingFuelLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fuel_logs").insert([payload]);
        if (error) throw error;
      }

      setIsFuelModalOpen(false);
      setNewFuelLog({});
      setEditingFuelLog(null);
      fetchFuelLogs();
      fetchTotals();
    } catch (err: any) {
      console.error("Error saving fuel log:", err);
      setFuelError(err.message || "Failed to save fuel log.");
    }
  };

  const handleAddExpense = async () => {
    setExpenseError(null);
    if (!newExpense.trip_id) return setExpenseError("Trip is required");
    if (!newExpense.vehicle_id) return setExpenseError("Vehicle is required");
    if (!newExpense.expense_type) return setExpenseError("Expense Type is required");
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      return setExpenseError("Amount must be greater than 0");
    }
    if (!newExpense.expense_date) return setExpenseError("Expense Date is required");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        trip_id: newExpense.trip_id,
        vehicle_id: newExpense.vehicle_id,
        expense_type: newExpense.expense_type,
        amount: Number(newExpense.amount),
        expense_date: newExpense.expense_date,
        remarks: newExpense.remarks || null,
        created_by: user?.id || null,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", editingExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert([payload]);
        if (error) throw error;
      }

      setIsExpenseModalOpen(false);
      setNewExpense({});
      setEditingExpense(null);
      fetchExpenses();
      fetchTotals();
    } catch (err: any) {
      console.error("Error saving expense:", err);
      setExpenseError(err.message || "Failed to save expense.");
    }
  };

  // Edit actions
  const openEditFuelLog = (log: DBFuelLog) => {
    setEditingFuelLog(log);
    setNewFuelLog({
      trip_id: log.trip_id,
      vehicle_id: log.vehicle_id,
      driver_id: log.driver_id,
      fuel_station: log.fuel_station,
      liters: log.liters,
      cost: log.cost,
      fuel_date: log.fuel_date,
    });
    setIsFuelModalOpen(true);
  };

  const openEditExpense = (exp: DBExpense) => {
    setEditingExpense(exp);
    setNewExpense({
      trip_id: exp.trip_id,
      vehicle_id: exp.vehicle_id,
      expense_type: exp.expense_type,
      amount: exp.amount,
      expense_date: exp.expense_date,
      remarks: exp.remarks || "",
    });
    setIsExpenseModalOpen(true);
  };

  // Delete actions
  const handleDeleteFuelLog = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fuel log?")) return;
    try {
      const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
      if (error) throw error;
      fetchFuelLogs();
      fetchTotals();
    } catch (err: any) {
      console.error("Error deleting fuel log:", err);
      alert(err.message || "Failed to delete fuel log.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      fetchExpenses();
      fetchTotals();
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      alert(err.message || "Failed to delete expense.");
    }
  };

  const grandTotal = fuelTotal + maintTotal + expenseTotal;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-10">
      {/* Search & Filters Controls */}
      <div className="flex flex-col gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full bg-background border-border text-sm"
            />
          </div>

          {/* Vehicle Filter */}
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border text-sm text-foreground">
              <SelectValue placeholder="Vehicle: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Vehicle: All</SelectItem>
              {vehiclesList.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.vehicle_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trip Filter */}
          <Select value={tripFilter} onValueChange={setTripFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border text-sm text-foreground">
              <SelectValue placeholder="Trip: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Trip: All</SelectItem>
              {tripsList.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.trip_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Driver Filter */}
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 bg-background border-border text-sm text-foreground">
              <SelectValue placeholder="Driver: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Driver: All</SelectItem>
              {driversList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Expense Type Filter */}
          <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-background border-border text-sm text-foreground">
              <SelectValue placeholder="Expense Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Expense Type: All</SelectItem>
              <SelectItem value="Toll">Toll</SelectItem>
              <SelectItem value="Parking">Parking</SelectItem>
              <SelectItem value="Repair">Repair</SelectItem>
              <SelectItem value="Cleaning">Cleaning</SelectItem>
              <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">From</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 bg-background border-border text-sm w-36"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">To</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 bg-background border-border text-sm w-36"
            />
            {(startDate ||
              endDate ||
              searchQuery !== "" ||
              vehicleFilter !== "All" ||
              tripFilter !== "All" ||
              driverFilter !== "All" ||
              expenseTypeFilter !== "All") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setVehicleFilter("All");
                  setTripFilter("All");
                  setDriverFilter("All");
                  setExpenseTypeFilter("All");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs hover:text-foreground text-muted-foreground h-9 px-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Top Section: Fuel Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Fuel Logs
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {/* Log Fuel Dialog */}
            <Dialog open={isFuelModalOpen} onOpenChange={handleOpenFuelModal}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Log Fuel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {editingFuelLog ? "Edit Fuel Log" : "Log Fuel"}
                  </DialogTitle>
                </DialogHeader>
                {fuelError && <p className="text-sm text-red-500 font-medium px-1">{fuelError}</p>}
                <div className="grid gap-4 py-4">
                  {/* Trip */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-trip" className="text-right text-muted-foreground">
                      Trip
                    </Label>
                    <div className="col-span-3">
                      <Select value={newFuelLog.trip_id || ""} onValueChange={handleFuelTripChange}>
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Trip" />
                        </SelectTrigger>
                        <SelectContent>
                          {tripsList.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.trip_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-vehicle" className="text-right text-muted-foreground">
                      Vehicle
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newFuelLog.vehicle_id || ""}
                        onValueChange={(val) => setNewFuelLog((prev) => ({ ...prev, vehicle_id: val }))}
                      >
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehiclesList.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.vehicle_name} / {v.registration_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-driver" className="text-right text-muted-foreground">
                      Driver
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newFuelLog.driver_id || ""}
                        onValueChange={(val) => setNewFuelLog((prev) => ({ ...prev, driver_id: val }))}
                      >
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {driversList.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fuel Station */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-station" className="text-right text-muted-foreground">
                      Station
                    </Label>
                    <Input
                      id="fuel-station"
                      placeholder="e.g. Shell Station"
                      className="col-span-3 bg-background"
                      value={newFuelLog.fuel_station || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, fuel_station: e.target.value })}
                    />
                  </div>

                  {/* Fuel Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-date" className="text-right text-muted-foreground">
                      Date
                    </Label>
                    <Input
                      id="fuel-date"
                      type="date"
                      className="col-span-3 bg-background"
                      value={newFuelLog.fuel_date || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, fuel_date: e.target.value })}
                    />
                  </div>

                  {/* Liters */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="liters" className="text-right text-muted-foreground">
                      Liters
                    </Label>
                    <Input
                      id="liters"
                      type="number"
                      placeholder="e.g. 42"
                      className="col-span-3 bg-background"
                      value={newFuelLog.liters === undefined ? "" : newFuelLog.liters}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, liters: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  {/* Fuel Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuelCost" className="text-right text-muted-foreground">
                      Fuel Cost
                    </Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      placeholder="e.g. 3150"
                      className="col-span-3 bg-background"
                      value={newFuelLog.cost === undefined ? "" : newFuelLog.cost}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, cost: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleOpenFuelModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogFuel} className="bg-primary text-primary-foreground">
                    {editingFuelLog ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Expense Dialog */}
            <Dialog open={isExpenseModalOpen} onOpenChange={handleOpenExpenseModal}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {editingExpense ? "Edit Expense" : "Add Expense"}
                  </DialogTitle>
                </DialogHeader>
                {expenseError && (
                  <p className="text-sm text-red-500 font-medium px-1">{expenseError}</p>
                )}
                <div className="grid gap-4 py-4">
                  {/* Trip */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-trip" className="text-right text-muted-foreground">
                      Trip
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newExpense.trip_id || ""}
                        onValueChange={handleExpenseTripChange}
                      >
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Trip" />
                        </SelectTrigger>
                        <SelectContent>
                          {tripsList.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.trip_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Vehicle */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-vehicle" className="text-right text-muted-foreground">
                      Vehicle
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newExpense.vehicle_id || ""}
                        onValueChange={(val) => setNewExpense((prev) => ({ ...prev, vehicle_id: val }))}
                      >
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehiclesList.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.vehicle_name} / {v.registration_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Expense Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-type" className="text-right text-muted-foreground">
                      Type
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newExpense.expense_type || ""}
                        onValueChange={(val) => setNewExpense((prev) => ({ ...prev, expense_type: val }))}
                      >
                        <SelectTrigger className="bg-background border-border text-sm text-foreground">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Toll">Toll</SelectItem>
                          <SelectItem value="Parking">Parking</SelectItem>
                          <SelectItem value="Repair">Repair</SelectItem>
                          <SelectItem value="Cleaning">Cleaning</SelectItem>
                          <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right text-muted-foreground">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="e.g. 120"
                      className="col-span-3 bg-background"
                      value={newExpense.amount === undefined ? "" : newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>

                  {/* Expense Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-date" className="text-right text-muted-foreground">
                      Date
                    </Label>
                    <Input
                      id="expense-date"
                      type="date"
                      className="col-span-3 bg-background"
                      value={newExpense.expense_date || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    />
                  </div>

                  {/* Remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="remarks" className="text-right text-muted-foreground">
                      Remarks
                    </Label>
                    <Input
                      id="remarks"
                      placeholder="e.g. Toll taxes"
                      className="col-span-3 bg-background"
                      value={newExpense.remarks || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleOpenExpenseModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense} className="bg-primary text-primary-foreground">
                    {editingExpense ? "Update" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Fuel Logs Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Trip Number
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Vehicle
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Driver
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Fuel Station
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Fuel Date
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Liters
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Fuel Cost
                  </th>
                  <th className="w-12 py-2 px-6 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      Loading fuel logs...
                    </td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                      No fuel logs found.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.trips?.trip_number || "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.vehicles
                          ? `${log.vehicles.vehicle_name} / ${log.vehicles.registration_number}`
                          : "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.drivers?.name || "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.fuel_station}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.fuel_date}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {log.liters} L
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm font-semibold text-foreground">
                        {log.cost.toLocaleString()}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-right">
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
                          <DropdownMenuContent align="end" className="w-32 bg-card border-border">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-foreground hover:bg-secondary"
                              onClick={() => openEditFuelLog(log)}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-500 hover:bg-red-500/10 focus:text-red-500"
                              onClick={() => handleDeleteFuelLog(log.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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
        </div>
      </div>

      {/* Bottom Section: Expenses */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Expenses Log
        </h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Trip
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Vehicle
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Expense Type
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Expense Date
                  </th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Remarks
                  </th>
                  <th className="w-12 py-2 px-6 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      No expenses found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {exp.trips?.trip_number || "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {exp.vehicles
                          ? `${exp.vehicles.vehicle_name} / ${exp.vehicles.registration_number}`
                          : "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {exp.expense_type}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm font-semibold text-foreground">
                        {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {exp.expense_date}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-sm text-foreground">
                        {exp.remarks || "—"}
                      </td>
                      <td className="py-2 px-6 whitespace-nowrap text-right">
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
                          <DropdownMenuContent align="end" className="w-32 bg-card border-border">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-foreground hover:bg-secondary"
                              onClick={() => openEditExpense(exp)}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-500 hover:bg-red-500/10 focus:text-red-500"
                              onClick={() => handleDeleteExpense(exp.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
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
        </div>
      </div>

      {/* Footer / Total Cost Grid */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Fuel Total
            </span>
            <span className="text-lg font-bold text-foreground">
              {fuelTotal.toLocaleString()}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Maintenance Total
            </span>
            <span className="text-lg font-bold text-foreground">
              {maintTotal.toLocaleString()}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Expense Total
            </span>
            <span className="text-lg font-bold text-foreground">
              {expenseTotal.toLocaleString()}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Grand Total
            </span>
            <span className="text-xl font-bold text-[#d97706]">
              {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
