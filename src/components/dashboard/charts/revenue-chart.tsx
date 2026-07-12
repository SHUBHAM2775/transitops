/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", dispatched: 150, completed: 140 },
  { month: "Feb", dispatched: 190, completed: 175 },
  { month: "Mar", dispatched: 210, completed: 198 },
  { month: "Apr", dispatched: 240, completed: 220 },
  { month: "May", dispatched: 200, completed: 190 },
  { month: "Jun", dispatched: 260, completed: 245 },
  { month: "Jul", dispatched: 290, completed: 270 },
  { month: "Aug", dispatched: 310, completed: 295 },
  { month: "Sep", dispatched: 350, completed: 330 },
  { month: "Oct", dispatched: 390, completed: 370 },
  { month: "Nov", dispatched: 420, completed: 400 },
  { month: "Dec", dispatched: 450, completed: 435 },
];

export function RevenueChart() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Trip Volume Trend</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Dispatched vs Completed monthly trips</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Dispatched</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>
      </div>

      <div className={`h-[280px] transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dispatchedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 220)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 220)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 145)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 145)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.005 260)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.12 0.005 260)",
                border: "1px solid oklch(0.22 0.005 260)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "oklch(0.95 0 0)", fontWeight: 600 }}
              itemStyle={{ color: "oklch(0.65 0 0)" }}
              formatter={(value: any) => [`${value} trips`, ""]}
            />
            <Area
              type="monotone"
              dataKey="dispatched"
              stroke="oklch(0.7 0.18 220)"
              strokeWidth={2}
              fill="url(#dispatchedGradient)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="oklch(0.7 0.18 145)"
              strokeWidth={2}
              fill="url(#completedGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
