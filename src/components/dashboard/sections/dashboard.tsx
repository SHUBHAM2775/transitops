"use client";

import { useState } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PipelineOverview } from "@/components/dashboard/charts/pipeline-overview";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { TopPerformers } from "@/components/dashboard/top-performers";
import { Truck, CheckCircle2, Wrench, MapPin, Clock, Users, Activity, ChevronDown } from "lucide-react";

export function DashboardSection() {
  const [vehicleType, setVehicleType] = useState("All");
  const [status, setStatus] = useState("All");
  const [region, setRegion] = useState("All");

  // Mock filtering logic for KPI cards to demonstrate interactivity
  const getFilteredValue = (baseValue: number, isPercentage: boolean = false) => {
    let multiplier = 1;
    if (vehicleType !== "All") multiplier *= 0.6;
    if (status !== "All") multiplier *= 0.8;
    if (region !== "All") multiplier *= 0.5;
    
    const val = baseValue * multiplier;
    if (isPercentage) {
      return (Math.round(val * 10) / 10).toFixed(1) + "%";
    }
    return Math.round(val).toString();
  };

  return (
    <div className="space-y-6">
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
              <option value="All">Vehicle Type: All</option>
              <option value="Bus">Vehicle Type: Bus</option>
              <option value="Van">Vehicle Type: Van</option>
              <option value="Sedan">Vehicle Type: Sedan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none bg-transparent border border-border hover:border-border/80 rounded-lg pl-3 pr-8 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-colors"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active</option>
              <option value="Maintenance">Status: Maintenance</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="appearance-none bg-transparent border border-border hover:border-border/80 rounded-lg pl-3 pr-8 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer transition-colors"
            >
              <option value="All">Region: All</option>
              <option value="North">Region: North</option>
              <option value="South">Region: South</option>
              <option value="East">Region: East</option>
              <option value="West">Region: West</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard
          title="Active Vehicles"
          value={getFilteredValue(142)}
          change="+4.2%"
          changeType="positive"
          icon={Truck}
          delay={0}
        />
        <MetricCard
          title="Available Vehicles"
          value={getFilteredValue(98)}
          change="+1.8%"
          changeType="positive"
          icon={CheckCircle2}
          delay={1}
        />
        <MetricCard
          title="In Maintenance"
          value={getFilteredValue(12)}
          change="+8.3%"
          changeType="negative"
          icon={Wrench}
          delay={2}
        />
        <MetricCard
          title="Active Trips"
          value={getFilteredValue(44)}
          change="+12.5%"
          changeType="positive"
          icon={MapPin}
          delay={3}
        />
        <MetricCard
          title="Pending Trips"
          value={getFilteredValue(18)}
          change="-4.7%"
          changeType="negative"
          icon={Clock}
          delay={4}
        />
        <MetricCard
          title="Drivers on Duty"
          value={getFilteredValue(56)}
          change="+3.2%"
          changeType="positive"
          icon={Users}
          delay={5}
        />
        <MetricCard
          title="Utilization (%)"
          value={getFilteredValue(88.5, true)}
          change="+2.1%"
          changeType="positive"
          icon={Activity}
          delay={6}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PipelineOverview />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDeals />
        <TopPerformers />
      </div>
    </div>
  );
}
