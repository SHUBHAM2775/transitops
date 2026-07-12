"use client";

import { useState, useEffect } from "react";

interface PipelineOverviewProps {
  vehicles?: {
    id: string;
    status: string;
    vehicle_type: string;
    region: string | null;
  }[];
}

export function PipelineOverview({ vehicles = [] }: PipelineOverviewProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const totalCount = vehicles.length;
  const availableCount = vehicles.filter((v) => v.status === "available").length;
  const onTripCount = vehicles.filter((v) => v.status === "on_trip").length;
  const inShopCount = vehicles.filter((v) => v.status === "in_shop").length;
  const retiredCount = vehicles.filter((v) => v.status === "retired").length;

  const calculatePct = (count: number) => {
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 1000) / 10;
  };

  const stages = [
    { name: "Available", value: calculatePct(availableCount), count: availableCount, color: "bg-chart-1" },
    { name: "On Trip", value: calculatePct(onTripCount), count: onTripCount, color: "bg-chart-2" },
    { name: "In Shop", value: calculatePct(inShopCount), count: inShopCount, color: "bg-chart-3" },
    { name: "Retired", value: calculatePct(retiredCount), count: retiredCount, color: "bg-accent" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col justify-between">
      <div>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-foreground">Vehicle Status</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Fleet distribution statistics</p>
        </div>

        <div className="space-y-5">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{stage.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{stage.count}</span>
                  <span className="text-sm font-semibold text-foreground">{stage.value}%</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{
                    width: isLoaded ? `${stage.value}%` : "0%",
                    transitionDelay: `${index * 150}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total fleet size */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Fleet Size</span>
          <span className="text-xl font-bold text-foreground">
            {totalCount} {totalCount === 1 ? "Vehicle" : "Vehicles"}
          </span>
        </div>
      </div>
    </div>
  );
}

