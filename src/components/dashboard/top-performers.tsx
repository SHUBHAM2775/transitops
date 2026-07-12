"use client";

import { Trophy, ShieldCheck } from "lucide-react";

const drivers = [
  { name: "Sarah Chen", trips: 24, safety: "98%", change: "+1.5%", rank: 1 },
  { name: "Mike Johnson", trips: 19, safety: "95%", change: "+0.8%", rank: 2 },
  { name: "Emily Davis", trips: 17, safety: "94%", change: "+1.2%", rank: 3 },
  { name: "James Wilson", trips: 15, safety: "92%", change: "+0.4%", rank: 4 },
  { name: "Lisa Park", trips: 14, safety: "91%", change: "+0.9%", rank: 5 },
];

export function TopPerformers() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Top Drivers</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly leaders by performance & safety</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
          <Trophy className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-3">
        {drivers.map((driver, index) => (
          <div
            key={driver.name}
            className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-right-2"
            style={{ animationDelay: `${(index + 4) * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-sm font-semibold text-accent-foreground">
                  {driver.name.split(" ").map((n) => n[0]).join("")}
                </div>
                {driver.rank <= 3 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning text-[10px] font-bold flex items-center justify-center text-background">
                    {driver.rank}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{driver.name}</p>
                <p className="text-xs text-muted-foreground">{driver.trips} trips completed</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{driver.safety} Safety</p>
              <div className="flex items-center justify-end gap-1 text-xs text-success">
                <ShieldCheck className="w-3 h-3" />
                {driver.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
