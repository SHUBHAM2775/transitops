"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string;
  serviceType: string;
  description: string;
  cost: number;
  serviceDate: string;
  closedDate: string | null;
  status: "open" | "closed";
}

interface DBVehicle {
  id: string;
  vehicle_name: string;
  registration_number: string;
  status: string;
}

export function MaintenanceSection() {
  const [records, setRecords] = useState<MaintenanceLog[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<DBVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "",
    description: "",
    cost: "",
    serviceDate: "",
  });

  const fetchMaintenance = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from("maintenance")
        .select(`
          id,
          vehicle_id,
          service_type,
          description,
          cost,
          service_date,
          closed_date,
          status,
          vehicles (
            id,
            vehicle_name,
            registration_number
          )
        `)
        .order("created_at", { ascending: false });

      if (fetchErr) throw fetchErr;

      const mapped: MaintenanceLog[] = (data || []).map((row: any) => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        vehicleName: row.vehicles?.vehicle_name || "Unknown Vehicle",
        registrationNumber: row.vehicles?.registration_number || "",
        serviceType: row.service_type || "",
        description: row.description || "",
        cost: Number(row.cost) || 0,
        serviceDate: row.service_date || "",
        closedDate: row.closed_date || null,
        status: row.status as "open" | "closed",
      }));

      setRecords(mapped);
    } catch (err: any) {
      console.error("Error fetching maintenance records:", err);
      setError(err.message || "Failed to fetch maintenance records.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const { data, error: vErr } = await supabase
        .from("vehicles")
        .select("id, vehicle_name, registration_number, status")
        .eq("status", "available")
        .order("vehicle_name", { ascending: true });

      if (vErr) throw vErr;
      setAvailableVehicles(data || []);
    } catch (err: any) {
      console.error("Error fetching available vehicles:", err);
    }
  };

  useEffect(() => {
    fetchMaintenance();
    fetchAvailableVehicles();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("maintenance-section-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maintenance" },
        () => {
          fetchMaintenance();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => {
          fetchAvailableVehicles();
          fetchMaintenance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const vId = form.vehicleId;
    const sType = form.serviceType.trim();
    const desc = form.description.trim();
    const costVal = Number(form.cost);
    const sDate = form.serviceDate;

    // Form Validations
    if (!vId) {
      setError("Vehicle is required.");
      return;
    }
    if (!sType) {
      setError("Service Type is required.");
      return;
    }
    if (isNaN(costVal) || costVal <= 0) {
      setError("Cost must be greater than zero.");
      return;
    }
    if (!sDate) {
      setError("Service Date is required.");
      return;
    }

    // Prevent duplicate open maintenance records
    const hasOpen = records.some((r) => r.vehicleId === vId && r.status === "open");
    if (hasOpen) {
      setError("An open maintenance record already exists for this vehicle.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // RPC call first
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_maintenance_record", {
        p_vehicle_id: vId,
        p_service_type: sType,
        p_description: desc,
        p_cost: costVal,
        p_service_date: sDate,
        p_created_by: user?.id || null,
      });

      if (rpcError) {
        // Handle database side raised exceptions (duplicate, etc.)
        if (rpcError.message && (rpcError.message.includes("exists") || rpcError.message.includes("Cost"))) {
          throw rpcError;
        }

        const isRpcMissing = rpcError.code === "3F000" || rpcError.status === 404 || rpcError.message.includes("function") || rpcError.message.includes("rpc");
        if (isRpcMissing) {
          console.warn("RPC 'create_maintenance_record' not found. Falling back to sequential queries.");

          // Sequential fallback checks
          const { data: existingOpen, error: exError } = await supabase
            .from("maintenance")
            .select("id")
            .eq("vehicle_id", vId)
            .eq("status", "open");
          
          if (exError) throw exError;
          if (existingOpen && existingOpen.length > 0) {
            setError("An open maintenance record already exists for this vehicle.");
            setIsSaving(false);
            return;
          }

          // Sequential insert
          const { error: insError } = await supabase
            .from("maintenance")
            .insert({
              vehicle_id: vId,
              service_type: sType,
              description: desc,
              cost: costVal,
              service_date: sDate,
              status: "open",
              created_by: user?.id || null,
              created_at: new Date().toISOString(),
            });

          if (insError) throw insError;

          // Sequential update vehicle
          const { error: vError } = await supabase
            .from("vehicles")
            .update({ status: "in_shop" })
            .eq("id", vId);

          if (vError) throw vError;
        } else {
          throw rpcError;
        }
      }

      setForm({
        vehicleId: "",
        serviceType: "",
        description: "",
        cost: "",
        serviceDate: "",
      });

      setSuccess("Maintenance record created successfully.");
      fetchMaintenance();
      fetchAvailableVehicles();
    } catch (err: any) {
      console.error("Error creating maintenance record:", err);
      setError(err.message || "Failed to save maintenance record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseMaintenance = async (recordId: string, vehicleId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const { error: rpcError } = await supabase.rpc("close_maintenance_record", {
        p_maintenance_id: recordId,
      });

      if (rpcError) {
        const isRpcMissing = rpcError.code === "3F000" || rpcError.status === 404 || rpcError.message.includes("function") || rpcError.message.includes("rpc");
        if (isRpcMissing) {
          console.warn("RPC 'close_maintenance_record' not found. Falling back to sequential queries.");

          const todayStr = new Date().toISOString().split("T")[0];
          
          const { error: mError } = await supabase
            .from("maintenance")
            .update({
              status: "closed",
              closed_date: todayStr,
            })
            .eq("id", recordId);

          if (mError) throw mError;

          const { data: vData, error: vGetError } = await supabase
            .from("vehicles")
            .select("status")
            .eq("id", vehicleId)
            .single();

          if (vGetError) throw vGetError;

          if (vData && vData.status !== "retired") {
            const { error: vError } = await supabase
              .from("vehicles")
              .update({ status: "available" })
              .eq("id", vehicleId);

            if (vError) throw vError;
          }
        } else {
          throw rpcError;
        }
      }

      setSuccess("Maintenance record closed successfully.");
      fetchMaintenance();
      fetchAvailableVehicles();
    } catch (err: any) {
      console.error("Error closing maintenance:", err);
      setError(err.message || "Failed to close maintenance record.");
    }
  };

  const handleDelete = async (recordId: string, vehicleId: string, status: "open" | "closed") => {
    setError(null);
    setSuccess(null);
    if (!confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      const { error: rpcError } = await supabase.rpc("delete_maintenance_record", {
        p_maintenance_id: recordId,
      });

      if (rpcError) {
        const isRpcMissing = rpcError.code === "3F000" || rpcError.status === 404 || rpcError.message.includes("function") || rpcError.message.includes("rpc");
        if (isRpcMissing) {
          console.warn("RPC 'delete_maintenance_record' not found. Falling back to sequential queries.");

          if (status === "open") {
            const { data: vData, error: vGetError } = await supabase
              .from("vehicles")
              .select("status")
              .eq("id", vehicleId)
              .single();

            if (vGetError) throw vGetError;

            if (vData && vData.status !== "retired") {
              const { error: vError } = await supabase
                .from("vehicles")
                .update({ status: "available" })
                .eq("id", vehicleId);

              if (vError) throw vError;
            }
          }

          const { error: mError } = await supabase
            .from("maintenance")
            .delete()
            .eq("id", recordId);

          if (mError) throw mError;
        } else {
          throw rpcError;
        }
      }

      setSuccess("Maintenance record deleted successfully.");
      fetchMaintenance();
      fetchAvailableVehicles();
    } catch (err: any) {
      console.error("Error deleting maintenance:", err);
      setError(err.message || "Failed to delete maintenance record.");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${month}/${day}/${year}`;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-10">
      {/* Top Part: Form */}
      <div className="bg-card/20 border border-border/50 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Log Service Record
        </h2>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg border border-green-600/30 bg-green-600/5 text-green-400 text-xs font-medium">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="text-xs uppercase text-muted-foreground tracking-wider">
              Vehicle
            </Label>
            <Select
              value={form.vehicleId}
              onValueChange={(val) => handleChange("vehicleId", val)}
            >
              <SelectTrigger id="vehicle" className="bg-background border-border">
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {availableVehicles.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground text-center">No available vehicles</div>
                ) : (
                  availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vehicle_name} {v.registration_number ? `(${v.registration_number})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service" className="text-xs uppercase text-muted-foreground tracking-wider">
              Service Type
            </Label>
            <Input
              id="service"
              placeholder="Oil Change"
              className="bg-background border-border"
              value={form.serviceType}
              onChange={(e) => handleChange("serviceType", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost" className="text-xs uppercase text-muted-foreground tracking-wider">
              Cost
            </Label>
            <Input
              id="cost"
              type="number"
              placeholder="2500"
              className="bg-background border-border"
              value={form.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs uppercase text-muted-foreground tracking-wider">
              Service Date
            </Label>
            <Input
              id="date"
              type="date"
              className="bg-background border-border text-foreground"
              value={form.serviceDate}
              onChange={(e) => handleChange("serviceDate", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase text-muted-foreground tracking-wider">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="Enter details about the service..."
            className="bg-background border-border min-h-[80px]"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4 border-t border-border/20">
          {/* Rules/Legends side-by-side */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 flex-1 max-w-2xl">
            <div className="flex items-center gap-4 w-full md:w-64">
              <span className="text-green-500 font-semibold w-16 text-xs sm:text-sm">Available</span>
              <div className="flex-1 flex items-center justify-center relative h-6">
                <div className="w-full h-px bg-muted-foreground/40 absolute top-1/2 -translate-y-1/2"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-muted-foreground/40 rotate-45"></div>
                <span className="text-muted-foreground text-[10px] bg-[#020204] px-2 relative z-10 text-center whitespace-nowrap">
                  create record
                </span>
              </div>
              <span className="text-[#d97706] font-semibold w-16 text-xs sm:text-sm text-right">In Shop</span>
            </div>

            <div className="flex items-center gap-4 w-full md:w-64">
              <span className="text-[#d97706] font-semibold w-16 text-xs sm:text-sm">In Shop</span>
              <div className="flex-1 flex items-center justify-center relative h-6">
                <div className="w-full h-px bg-muted-foreground/40 absolute top-1/2 -translate-y-1/2"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-muted-foreground/40 rotate-45"></div>
                <span className="text-muted-foreground text-[10px] bg-[#020204] px-2 relative z-10 text-center whitespace-nowrap">
                  close record
                </span>
              </div>
              <span className="text-green-500 font-semibold w-16 text-xs sm:text-sm text-right">Available</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <p className="text-[#d97706] text-xs font-medium">
              Note: In Shop vehicles are removed from the dispatch pool.
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-black font-semibold h-10 px-8 transition-colors w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Part: Table */}
      <div className="min-w-0">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Service Log
          </h2>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-fit">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Vehicle
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Service
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Description
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Service Date
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Closed Date
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Cost
                    </th>
                    <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="py-2 px-6 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading service records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No service records.
                      </td>
                    </tr>
                  ) : (
                    records.map((record, index) => (
                      <tr
                        key={record.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                      >
                        <td className="py-2 px-6 font-medium text-sm text-foreground whitespace-nowrap">
                          {record.vehicleName}
                        </td>
                        <td className="py-2 px-6 text-sm text-foreground whitespace-nowrap">
                          {record.serviceType}
                        </td>
                        <td className="py-2 px-6 text-sm text-muted-foreground max-w-[200px] truncate" title={record.description}>
                          {record.description || "—"}
                        </td>
                        <td className="py-2 px-6 text-sm text-foreground whitespace-nowrap">
                          {formatDate(record.serviceDate)}
                        </td>
                        <td className="py-2 px-6 text-sm text-foreground whitespace-nowrap">
                          {record.closedDate ? formatDate(record.closedDate) : "—"}
                        </td>
                        <td className="py-2 px-6 font-semibold text-sm text-foreground whitespace-nowrap">
                          {record.cost.toLocaleString()}
                        </td>
                        <td className="py-2 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-4 py-1.5 text-sm font-semibold rounded-md border ${
                              record.status === "closed"
                                ? "bg-green-600/20 text-green-500 border-green-600/30"
                                : "bg-[#d97706]/20 text-[#d97706] border-[#d97706]/30"
                            }`}
                          >
                            {record.status === "closed" ? "Completed" : "In Shop"}
                          </span>
                        </td>
                        <td className="py-2 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {record.status === "open" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseMaintenance(record.id, record.vehicleId);
                                }}
                                className="h-8 px-2 text-xs border-green-600/30 text-green-500 hover:bg-green-600/10 hover:text-green-400"
                              >
                                Close
                              </Button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(record.id, record.vehicleId, record.status);
                              }}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
