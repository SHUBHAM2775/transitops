"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, CheckCircle2, Navigation, Wrench, AlertCircle } from "lucide-react";

interface RecentDealsProps {
  trips?: {
    id: string;
    source: string;
    destination: string;
    status: string;
    created_at: string;
    planned_distance: number;
    vehicle_id: string | null;
    driver_id: string | null;
  }[];
  vehicles?: {
    id: string;
    registration_number: string;
    vehicle_name: string;
  }[];
  drivers?: {
    id: string;
    name: string;
  }[];
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Completed",
  },
  dispatched: {
    icon: Navigation,
    color: "text-accent",
    bg: "bg-accent/10",
    label: "Dispatched",
  },
  maintenance: {
    icon: Wrench,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "In Maintenance",
  },
  draft: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-secondary",
    label: "Draft",
  },
  cancelled: {
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Cancelled",
  },
};

function getRelativeTime(dateString: string) {
  if (!dateString) return "Unknown date";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

export function RecentDeals({ trips = [], vehicles = [], drivers = [] }: RecentDealsProps) {
  // Sort by created_at desc and take top 5
  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Trips</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Latest transit activities</p>
        </div>
        <button className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium transition-colors group">
          View all
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      <div className="space-y-3">
        {recentTrips.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No recent trips found.
          </div>
        ) : (
          recentTrips.map((trip, index) => {
            const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
            const driver = drivers.find((d) => d.id === trip.driver_id);
            
            const vehicleCode = vehicle 
              ? (vehicle.vehicle_name.split(" ")[0].substring(0, 2).toUpperCase() + vehicle.registration_number.slice(-2))
              : "TRIP";

            const route = `${trip.source} → ${trip.destination}`;
            const distance = `${trip.planned_distance} mi`;
            const driverName = driver ? driver.name : "Unassigned";
            const relativeTime = getRelativeTime(trip.created_at);

            const status = statusConfig[trip.status as keyof typeof statusConfig] || statusConfig.draft;
            const StatusIcon = status.icon;

            return (
              <div
                key={trip.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${(index + 3) * 100}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200">
                    {vehicleCode}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{route}</p>
                    <p className="text-xs text-muted-foreground">{driverName} • {relativeTime}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-foreground">{distance}</span>
                  <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium", status.bg, status.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

