"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, CheckCircle2, Navigation, Wrench } from "lucide-react";

const trips = [
  {
    vehicleId: "V08",
    route: "Chicago HQ → Detroit Hub",
    distance: "284 mi",
    status: "dispatched",
    date: "14 mins ago",
    driver: "David Miller",
  },
  {
    vehicleId: "V19",
    route: "Austin Depot → Houston Term",
    distance: "162 mi",
    status: "completed",
    date: "1 hour ago",
    driver: "Sarah Chen",
  },
  {
    vehicleId: "V45",
    route: "Phoenix Port → LA Terminal",
    distance: "370 mi",
    status: "dispatched",
    date: "3 hours ago",
    driver: "Michael Johnson",
  },
  {
    vehicleId: "V72",
    route: "LA Terminal → Las Vegas Depot",
    distance: "270 mi",
    status: "maintenance",
    date: "6 hours ago",
    driver: "Robert Garcia",
  },
  {
    vehicleId: "V54",
    route: "Miami Depot → Orlando Station",
    distance: "235 mi",
    status: "completed",
    date: "1 day ago",
    driver: "Emily Davis",
  },
];

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
};

export function RecentDeals() {
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
        {trips.map((trip, index) => {
          const status = statusConfig[trip.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <div
              key={trip.vehicleId}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-left-2"
              style={{ animationDelay: `${(index + 3) * 100}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200">
                  {trip.vehicleId}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{trip.route}</p>
                  <p className="text-xs text-muted-foreground">{trip.driver} • {trip.date}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-semibold text-foreground">{trip.distance}</span>
                <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium", status.bg, status.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
