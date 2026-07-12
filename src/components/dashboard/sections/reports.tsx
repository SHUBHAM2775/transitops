"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from "recharts";
import { FileText, Download, Clock } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 5000 },
  { month: "Mar", revenue: 4500 },
  { month: "Apr", revenue: 6000 },
  { month: "May", revenue: 5500 },
  { month: "Jun", revenue: 7000 },
  { month: "Jul", revenue: 6500 },
];

const tripCompletionData = [
  { month: "Jan", rate: 85 },
  { month: "Feb", rate: 88 },
  { month: "Mar", rate: 86 },
  { month: "Apr", rate: 92 },
  { month: "May", rate: 90 },
  { month: "Jun", rate: 95 },
  { month: "Jul", rate: 94 },
];

const expenseData = [
  { name: "Fuel", value: 45, color: "oklch(0.7 0.18 220)" },
  { name: "Maintenance", value: 35, color: "oklch(0.75 0.18 55)" },
  { name: "Tolls", value: 10, color: "oklch(0.7 0.18 145)" },
  { name: "Insurance", value: 10, color: "oklch(0.65 0.2 25)" },
];

const costliestVehicles = [
  { name: "TRUCK-11", cost: 18000, max: 20000, color: "bg-red-400" },
  { name: "MINI-03", cost: 6200, max: 20000, color: "bg-[#d97706]" },
  { name: "VAN-05", cost: 3150, max: 20000, color: "bg-blue-400" },
];

const reports = [
  { id: "1", name: "Monthly Fleet Cost Summary", type: "Financial", date: "Jul 10, 2026", status: "ready" },
  { id: "2", name: "Q2 Utilization Analysis", type: "Performance", date: "Jul 05, 2026", status: "ready" },
  { id: "3", name: "Driver Safety Review", type: "Compliance", date: "Jul 02, 2026", status: "ready" },
  { id: "4", name: "Maintenance Forecast", type: "Predictive", date: "Jul 01, 2026", status: "generating" },
];

export function ReportsSection() {
  const [chartsLoaded, setChartsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChartsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      {/* Top KPI Row from Mockup */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#020204] border border-border p-5 border-l-4 border-l-blue-500 rounded-md shadow-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Fuel Efficiency</div>
            <div className="text-2xl font-semibold text-white">8.4 km/l</div>
          </div>
          <div className="bg-[#020204] border border-border p-5 border-l-4 border-l-green-500 rounded-md shadow-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Fleet Utilization</div>
            <div className="text-2xl font-semibold text-white">81%</div>
          </div>
          <div className="bg-[#020204] border border-border p-5 border-l-4 border-l-[#d97706] rounded-md shadow-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Operational Cost</div>
            <div className="text-2xl font-semibold text-white">34,070</div>
          </div>
          <div className="bg-[#020204] border border-border p-5 border-l-4 border-l-green-500 rounded-md shadow-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Vehicle ROI</div>
            <div className="text-2xl font-semibold text-white">14.2%</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">
          ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        </p>
      </div>

      {/* Mockup Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-[#020204] border border-border p-5 rounded-md shadow-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Monthly Revenue</h3>
          <div className={`h-[200px] transition-opacity duration-700 ${chartsLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(value) => value.toLocaleString()}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.12 0.005 260)" }}
                  contentStyle={{
                    backgroundColor: "oklch(0.12 0.005 260)",
                    border: "1px solid oklch(0.22 0.005 260)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "oklch(0.95 0 0)", fontWeight: 600 }}
                  formatter={(value: any) => [value.toLocaleString(), "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#4B88C6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Costliest Vehicles Horizontal Bars */}
        <div className="bg-[#020204] border border-border p-5 rounded-md shadow-sm flex flex-col">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-8">Top Costliest Vehicles</h3>
          <div className="space-y-8 flex-1 justify-center flex flex-col">
            {costliestVehicles.map((vehicle, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {vehicle.name}
                </div>
                <div className="flex-1 h-5 bg-secondary/50 rounded-sm overflow-hidden group relative">
                  <div 
                    className={`h-full ${vehicle.color} rounded-sm transition-all duration-500`} 
                    style={{ width: `${(vehicle.cost / vehicle.max) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right text-xs font-semibold text-foreground">
                  {vehicle.cost.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Essential Graphs (Kept from old design but adapted) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Completion Trend Line Chart */}
        <div className="bg-[#020204] border border-border rounded-md p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Completion Trend</h3>
            <p className="text-xs text-muted-foreground mt-1">Monthly successful trips vs total dispatched</p>
          </div>
          <div className={`h-[250px] transition-opacity duration-700 ${chartsLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tripCompletionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(value) => `${value}%`}
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
                  formatter={(value: any) => [`${value}%`, "Completion Rate"]}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="oklch(0.7 0.18 145)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-[#020204] border border-border rounded-md p-5 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-1">Where operational costs are distributed</p>
          </div>
          <div className="flex items-center gap-8">
            <div className={`w-[180px] h-[180px] transition-opacity duration-700 ${chartsLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {expenseData.map((source, index) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between animate-in fade-in slide-in-from-right-2"
                  style={{ animationDelay: `${(index + 2) * 100}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-xs text-foreground uppercase tracking-wider">{source.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports Table (Text Data) */}
      <div className="bg-[#020204] border border-border rounded-md overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Reports</h3>
            <p className="text-xs text-muted-foreground mt-1">Generated text data and analysis exports</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
            <FileText className="w-3 h-3" />
            Generate New
          </button>
        </div>
        <div className="divide-y divide-border">
          {reports.map((report, index) => (
            <div
              key={report.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
              style={{ animationDelay: `${(index + 2) * 50}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-secondary/50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{report.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] uppercase tracking-wider">{report.type}</span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {report.status === "generating" ? (
                  <div className="flex items-center gap-2 text-xs text-[#d97706]">
                    <Clock className="w-3 h-3 animate-pulse" />
                    Generating...
                  </div>
                ) : (
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
