"use client";

import { useState, useEffect, useCallback } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PipelineOverview } from "@/components/dashboard/charts/pipeline-overview";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { TopPerformers } from "@/components/dashboard/top-performers";
import { Truck, CheckCircle2, Wrench, MapPin, Clock, Users, Activity, ChevronDown, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_name: string;
  vehicle_type: string;
  region: string | null;
  status: string;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  status: string;
  created_at: string;
  planned_distance: number;
  vehicle_id: string | null;
  driver_id: string | null;
}

interface Driver {
  id: string;
  name: string;
  safety_score: number;
  status: string;
}

export function DashboardSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicleTypes, setVehicleTypes] = useState<string[]>(["All"]);
  const [statuses, setStatuses] = useState<string[]>(["All"]);
  const [regions, setRegions] = useState<string[]>(["All"]);

  const [vehicleType, setVehicleType] = useState("All");
  const [status, setStatus] = useState("All");
  const [region, setRegion] = useState("All");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiclesRes, tripsRes, driversRes] = await Promise.all([
        supabase.from("vehicles").select("id, registration_number, vehicle_name, vehicle_type, region, status"),
        supabase.from("trips").select("id, source, destination, status, created_at, planned_distance, vehicle_id, driver_id"),
        supabase.from("drivers").select("id, name, safety_score, status")
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (tripsRes.error) throw tripsRes.error;
      if (driversRes.error) throw driversRes.error;

      const vehiclesData: Vehicle[] = vehiclesRes.data || [];
      const tripsData: Trip[] = tripsRes.data || [];
      const driversData: Driver[] = driversRes.data || [];

      setVehicles(vehiclesData);
      setTrips(tripsData);
      setDrivers(driversData);

      // Extract distinct filter options
      const uniqueTypes = Array.from(new Set(vehiclesData.map((v) => v.vehicle_type))).filter(Boolean) as string[];
      const uniqueStatuses = Array.from(new Set(vehiclesData.map((v) => v.status))).filter(Boolean) as string[];
      const uniqueRegions = Array.from(new Set(vehiclesData.map((v) => v.region))).filter(Boolean) as string[];

      setVehicleTypes(["All", ...uniqueTypes.sort()]);
      setStatuses(["All", ...uniqueStatuses.sort()]);
      setRegions(["All", ...uniqueRegions.sort()]);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel("dashboard-section-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchType = vehicleType === "All" || v.vehicle_type === vehicleType;
    const matchStatus = status === "All" || v.status === status;
    const matchRegion = region === "All" || v.region === region;
    return matchType && matchStatus && matchRegion;
  });

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    if (vehicleType === "All" && status === "All" && region === "All") {
      return true;
    }
    if (!t.vehicle_id) return false;
    const vehicle = vehicles.find((v) => v.id === t.vehicle_id);
    if (!vehicle) return false;
    const matchType = vehicleType === "All" || vehicle.vehicle_type === vehicleType;
    const matchStatus = status === "All" || vehicle.status === status;
    const matchRegion = region === "All" || vehicle.region === region;
    return matchType && matchStatus && matchRegion;
  });

  // Filter drivers
  const filteredDrivers = drivers.filter((d) => {
    if (d.status !== "on_trip") return false;
    if (vehicleType === "All" && status === "All" && region === "All") {
      return true;
    }
    const activeTrip = trips.find(
      (t) => t.driver_id === d.id && t.status === "dispatched"
    );
    if (!activeTrip || !activeTrip.vehicle_id) return false;
    const vehicle = vehicles.find((v) => v.id === activeTrip.vehicle_id);
    if (!vehicle) return false;
    const matchType = vehicleType === "All" || vehicle.vehicle_type === vehicleType;
    const matchStatus = status === "All" || vehicle.status === status;
    const matchRegion = region === "All" || vehicle.region === region;
    return matchType && matchStatus && matchRegion;
  });

  // KPIs
  const activeVehiclesCount = filteredVehicles.filter((v) => v.status !== "retired").length;
  const availableVehiclesCount = filteredVehicles.filter((v) => v.status === "available").length;
  const maintenanceVehiclesCount = filteredVehicles.filter((v) => v.status === "in_shop").length;
  const activeTripsCount = filteredTrips.filter((t) => t.status === "dispatched").length;
  const pendingTripsCount = filteredTrips.filter((t) => t.status === "draft").length;
  const driversOnDutyCount = filteredDrivers.length;

  const onTripVehiclesCount = filteredVehicles.filter((v) => v.status === "on_trip").length;
  const nonRetiredVehiclesCount = filteredVehicles.filter((v) => v.status !== "retired").length;
  const utilization = nonRetiredVehiclesCount > 0 
    ? (onTripVehiclesCount / nonRetiredVehiclesCount) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error loading dashboard metrics: {error}</span>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest ml-1">
          Filters
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="appearance-none bg-transparent border border-border hover:border-border/80 rounded-lg pl-3 pr-8 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-colors"
            >
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  Vehicle Type: {type}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-transparent border border-border hover:border-border/80 rounded-lg pl-3 pr-8 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-colors"
            >
              {statuses.map((stat) => (
                <option key={stat} value={stat}>
                  Status: {stat === "All" ? "All" : stat.charAt(0).toUpperCase() + stat.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none bg-transparent border border-border hover:border-border/80 rounded-lg pl-3 pr-8 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-colors"
            >
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  Region: {reg}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard
          title="Active Vehicles"
          value={isLoading ? "..." : activeVehiclesCount.toString()}
          change=""
          changeType="neutral"
          icon={Truck}
          delay={0}
        />
        <MetricCard
          title="Available Vehicles"
          value={isLoading ? "..." : availableVehiclesCount.toString()}
          change=""
          changeType="neutral"
          icon={CheckCircle2}
          delay={1}
        />
        <MetricCard
          title="In Maintenance"
          value={isLoading ? "..." : maintenanceVehiclesCount.toString()}
          change=""
          changeType="neutral"
          icon={Wrench}
          delay={2}
        />
        <MetricCard
          title="Active Trips"
          value={isLoading ? "..." : activeTripsCount.toString()}
          change=""
          changeType="neutral"
          icon={MapPin}
          delay={3}
        />
        <MetricCard
          title="Pending Trips"
          value={isLoading ? "..." : pendingTripsCount.toString()}
          change=""
          changeType="neutral"
          icon={Clock}
          delay={4}
        />
        <MetricCard
          title="Drivers on Duty"
          value={isLoading ? "..." : driversOnDutyCount.toString()}
          change=""
          changeType="neutral"
          icon={Users}
          delay={5}
        />
        <MetricCard
          title="Utilization (%)"
          value={isLoading ? "..." : utilization.toFixed(1) + "%"}
          change=""
          changeType="neutral"
          icon={Activity}
          delay={6}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart trips={filteredTrips} />
        </div>
        <PipelineOverview vehicles={filteredVehicles} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDeals trips={filteredTrips} vehicles={vehicles} drivers={drivers} />
        <TopPerformers drivers={drivers} trips={trips} />
      </div>
    </div>
  );
}

