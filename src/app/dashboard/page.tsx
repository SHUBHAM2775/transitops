"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// Types for components
interface KPICardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor: string;
  trendUp: boolean;
  trendVal: string;
}

function KPICard({ label, value, icon, iconBgColor, trendUp, trendVal }: KPICardProps) {
  return (
    <div className="glass-card rounded-xl p-4.5 flex flex-col justify-between hover:border-card-border/80 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-semibold text-[#8B92A0] uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBgColor} flex items-center justify-center border border-white/5`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-text-primary tracking-tight">{value}</span>
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendUp ? "text-accent-green" : "text-accent-red"}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {trendUp ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-11-11-4 4-6-6" />
            )}
          </svg>
          {trendVal}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null);

  // Authentication check
  useEffect(() => {
    const loggedIn = localStorage.getItem("transitops_logged_in");
    if (loggedIn !== "true") {
      router.push("/");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-[#F5F6F7] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-accent-blue" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Monthly data for the Trip Volume Trend Chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dispatchedTrips = [150, 190, 210, 240, 200, 260, 290, 310, 350, 390, 420, 450];
  const completedTrips = [140, 175, 198, 220, 190, 245, 270, 295, 330, 370, 400, 435];

  // SVG Chart Dimensions
  const chartWidth = 650;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 20;

  // Helpers to calculate coordinates
  const getX = (idx: number) => paddingX + (idx / (months.length - 1)) * (chartWidth - paddingX * 2);
  const getY = (val: number) => {
    const maxVal = 500;
    const minVal = 0;
    const range = maxVal - minVal;
    const heightRange = chartHeight - paddingY * 2;
    return chartHeight - paddingY - ((val - minVal) / range) * heightRange;
  };

  // Generate SVG Path for Dispatched Trips
  const dispatchedPath = dispatchedTrips.reduce((acc, val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    if (idx === 0) return `M ${x} ${y}`;
    
    // Smooth curves using bezier points
    const prevX = getX(idx - 1);
    const prevY = getY(dispatchedTrips[idx - 1]);
    const cpX1 = prevX + (x - prevX) / 2;
    const cpY1 = prevY;
    const cpX2 = prevX + (x - prevX) / 2;
    const cpY2 = y;
    
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
  }, "");

  // Area under path
  const dispatchedAreaPath = `${dispatchedPath} L ${getX(months.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  // Generate SVG Path for Completed Trips
  const completedPath = completedTrips.reduce((acc, val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    if (idx === 0) return `M ${x} ${y}`;
    
    const prevX = getX(idx - 1);
    const prevY = getY(completedTrips[idx - 1]);
    const cpX1 = prevX + (x - prevX) / 2;
    const cpY1 = prevY;
    const cpX2 = prevX + (x - prevX) / 2;
    const cpY2 = y;
    
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
  }, "");

  const completedAreaPath = `${completedPath} L ${getX(months.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  return (
    <div className="flex bg-[#0A0B0F] min-h-screen text-[#F5F6F7]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Dashboard" />

        {/* Inner Content Padding */}
        <main className="p-8 space-y-6">
          
          {/* Row of 7 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KPICard
              label="Active Vehicles"
              value="142"
              icon={
                <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16V10a2 2 0 00-2-2h-3V5H8v11" />
                </svg>
              }
              iconBgColor="bg-accent-blue/10"
              trendUp={true}
              trendVal="4.2%"
            />
            <KPICard
              label="Available Vehicles"
              value="98"
              icon={
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconBgColor="bg-accent-green/10"
              trendUp={true}
              trendVal="1.8%"
            />
            <KPICard
              label="In Maintenance"
              value="12"
              icon={
                <svg className="w-4 h-4 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              }
              iconBgColor="bg-accent-orange/10"
              trendUp={false}
              trendVal="8.3%"
            />
            <KPICard
              label="Active Trips"
              value="44"
              icon={
                <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
              iconBgColor="bg-accent-blue/10"
              trendUp={true}
              trendVal="12.5%"
            />
            <KPICard
              label="Pending Trips"
              value="18"
              icon={
                <svg className="w-4 h-4 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconBgColor="bg-accent-orange/10"
              trendUp={false}
              trendVal="4.7%"
            />
            <KPICard
              label="Drivers on Duty"
              value="56"
              icon={
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              iconBgColor="bg-accent-green/10"
              trendUp={true}
              trendVal="3.2%"
            />
            <KPICard
              label="Utilization (%)"
              value="88.5%"
              icon={
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              iconBgColor="bg-accent-green/10"
              trendUp={true}
              trendVal="2.1%"
            />
          </div>

          {/* Middle Section: Trip Volume Trend (60%) + Vehicle Status (40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            
            {/* Trip Volume Trend Area Chart (60% width) */}
            <div className="lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Trip Volume Trend</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Dispatched vs Completed monthly trips</p>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                      <span>Dispatched</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="mt-8 relative h-[220px]">
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                    {/* Horizontal Gridlines */}
                    {[0, 125, 250, 375, 500].map((tick) => (
                      <line
                        key={tick}
                        x1={paddingX}
                        y1={getY(tick)}
                        x2={chartWidth - paddingX}
                        y2={getY(tick)}
                        stroke="#1E2028"
                        strokeDasharray="4,4"
                        strokeWidth={1}
                      />
                    ))}

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="dispatchedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fills */}
                    <path d={dispatchedAreaPath} fill="url(#dispatchedGrad)" />
                    <path d={completedAreaPath} fill="url(#completedGrad)" />

                    {/* Lines */}
                    <path d={dispatchedPath} fill="none" stroke="#3B82F6" strokeWidth={2.5} />
                    <path d={completedPath} fill="none" stroke="#22C55E" strokeWidth={2.5} />

                    {/* Interactive Hover Nodes */}
                    {months.map((m, idx) => {
                      const x = getX(idx);
                      const y1 = getY(dispatchedTrips[idx]);
                      const y2 = getY(completedTrips[idx]);
                      const isHovered = activeMonthIdx === idx;

                      return (
                        <g key={idx} className="cursor-pointer">
                          {/* Vertical guide line on hover */}
                          {isHovered && (
                            <line
                              x1={x}
                              y1={paddingY}
                              x2={x}
                              y2={chartHeight - paddingY}
                              stroke="#1E2028"
                              strokeWidth={1.5}
                              strokeDasharray="2,2"
                            />
                          )}

                          {/* Invisible hover area */}
                          <rect
                            x={x - 15}
                            y={0}
                            width={30}
                            height={chartHeight}
                            fill="transparent"
                            onMouseEnter={() => setActiveMonthIdx(idx)}
                            onMouseLeave={() => setActiveMonthIdx(null)}
                          />

                          {/* Data points */}
                          <circle
                            cx={x}
                            cy={y1}
                            r={isHovered ? 5 : 3.5}
                            fill="#3B82F6"
                            stroke="#12141A"
                            strokeWidth={1.5}
                          />
                          <circle
                            cx={x}
                            cy={y2}
                            r={isHovered ? 5 : 3.5}
                            fill="#22C55E"
                            stroke="#12141A"
                            strokeWidth={1.5}
                          />
                        </g>
                      );
                    })}

                    {/* X-Axis labels */}
                    {months.map((m, idx) => (
                      <text
                        key={idx}
                        x={getX(idx)}
                        y={chartHeight - 4}
                        fill="#8B92A0"
                        fontSize={10}
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {m}
                      </text>
                    ))}
                  </svg>

                  {/* HTML Tooltip on hover */}
                  {activeMonthIdx !== null && (
                    <div
                      className="absolute z-20 bg-sidebar-bg/95 border border-card-border p-2.5 rounded-lg shadow-xl text-left pointer-events-none"
                      style={{
                        left: `${Math.min(getX(activeMonthIdx) + 15, chartWidth - 160)}px`,
                        top: `${Math.min(getY(dispatchedTrips[activeMonthIdx]) - 40, chartHeight - 110)}px`,
                      }}
                    >
                      <p className="text-[11px] font-bold text-text-primary tracking-wide border-b border-card-border/60 pb-1 mb-1">
                        {months[activeMonthIdx]} 2026
                      </p>
                      <div className="space-y-0.5 text-[10.5px]">
                        <p className="flex justify-between items-center gap-3">
                          <span className="text-text-secondary font-medium">Dispatched:</span>
                          <span className="text-[#3B82F6] font-bold">{dispatchedTrips[activeMonthIdx]} trips</span>
                        </p>
                        <p className="flex justify-between items-center gap-3">
                          <span className="text-text-secondary font-medium">Completed:</span>
                          <span className="text-[#22C55E] font-bold">{completedTrips[activeMonthIdx]} trips</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Status (40% width) */}
            <div className="lg:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary">Vehicle Status</h3>
                <p className="text-xs text-text-secondary mt-0.5">Fleet distribution statistics</p>

                {/* Progress bars list */}
                <div className="mt-8 space-y-4.5">
                  {/* Row 1: Available */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">Available</span>
                      <span className="text-accent-green">98 <span className="text-text-secondary font-normal">(60.5%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1A1E26]">
                      <div className="h-full rounded-full bg-accent-green" style={{ width: "60.5%" }} />
                    </div>
                  </div>

                  {/* Row 2: On Trip */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">On Trip</span>
                      <span className="text-accent-blue">44 <span className="text-text-secondary font-normal">(27.2%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1A1E26]">
                      <div className="h-full rounded-full bg-accent-blue" style={{ width: "27.2%" }} />
                    </div>
                  </div>

                  {/* Row 3: In Shop */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">In Shop</span>
                      <span className="text-accent-orange">12 <span className="text-text-secondary font-normal">(7.4%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1A1E26]">
                      <div className="h-full rounded-full bg-accent-orange" style={{ width: "7.4%" }} />
                    </div>
                  </div>

                  {/* Row 4: Retired */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-primary">Retired</span>
                      <span className="text-accent-red">8 <span className="text-text-secondary font-normal">(4.9%)</span></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1A1E26]">
                      <div className="h-full rounded-full bg-accent-red" style={{ width: "4.9%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Fleet Size Summary */}
              <div className="pt-4 border-t border-card-border mt-6">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-text-secondary">Total Fleet Size</span>
                  <span className="text-text-primary text-base tracking-tight">162 Vehicles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Trips (50%) + Top Drivers (50%) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Trips */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Recent Trips</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Latest dispatched transit activities</p>
                </div>
                <button className="text-xs font-semibold text-accent-blue hover:text-accent-blue/80 flex items-center gap-1 transition-colors">
                  <span>View all</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* List rows */}
              <div className="divide-y divide-card-border/60">
                
                {/* Row 1 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1D212E] border border-accent-blue/20 flex items-center justify-center font-bold text-xs text-accent-blue">
                      V08
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Chicago HQ → Detroit Hub</p>
                      <p className="text-xs text-text-secondary mt-0.5">David Miller • 14 mins ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">284 mi</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/25 mt-1">
                      <span className="w-1 h-1 rounded-full bg-accent-blue" />
                      Dispatched
                    </span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#142A1D] border border-accent-green/20 flex items-center justify-center font-bold text-xs text-accent-green">
                      V19
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Austin Depot → Houston Term</p>
                      <p className="text-xs text-text-secondary mt-0.5">Sarah Chen • 1 hour ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">162 mi</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/15 text-accent-green border border-accent-green/25 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      Completed
                    </span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1D212E] border border-accent-blue/20 flex items-center justify-center font-bold text-xs text-accent-blue">
                      V45
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Phoenix Port → LA Terminal</p>
                      <p className="text-xs text-text-secondary mt-0.5">Michael Johnson • 3 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">370 mi</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/25 mt-1">
                      <span className="w-1 h-1 rounded-full bg-accent-blue" />
                      Dispatched
                    </span>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#271E14] border border-accent-orange/20 flex items-center justify-center font-bold text-xs text-accent-orange">
                      V72
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">LA Terminal → Las Vegas Depot</p>
                      <p className="text-xs text-text-secondary mt-0.5">Robert Garcia • 6 hours ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">270 mi</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-orange/15 text-accent-orange border border-accent-orange/25 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
                      In Maintenance
                    </span>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#142A1D] border border-accent-green/20 flex items-center justify-center font-bold text-xs text-accent-green">
                      V54
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Miami Depot → Orlando Station</p>
                      <p className="text-xs text-text-secondary mt-0.5">Emily Davis • 1 day ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">235 mi</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent-green/15 text-accent-green border border-accent-green/25 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      Completed
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Top Drivers */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold text-text-primary">Top Drivers</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Monthly leaders by performance & safety</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
                  <svg className="w-4 h-4 text-accent-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0L4 12m8 0l8-4M4 18h16" />
                  </svg>
                </div>
              </div>

              {/* List rows */}
              <div className="divide-y divide-card-border/60">
                
                {/* Driver 1 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#142A1D] border border-accent-green/20 flex items-center justify-center font-bold text-sm text-accent-green">
                        SC
                      </div>
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-orange flex items-center justify-center text-[9px] font-bold text-white border-2 border-card-bg">
                        1
                      </span>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Sarah Chen</p>
                      <p className="text-xs text-text-secondary mt-0.5">24 trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">98% Safety</p>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-accent-green mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
                      </svg>
                      +1.5%
                    </span>
                  </div>
                </div>

                {/* Driver 2 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#1A233A] border border-accent-blue/20 flex items-center justify-center font-bold text-sm text-accent-blue">
                        MJ
                      </div>
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-orange flex items-center justify-center text-[9px] font-bold text-white border-2 border-card-bg">
                        2
                      </span>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Mike Johnson</p>
                      <p className="text-xs text-text-secondary mt-0.5">19 trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">95% Safety</p>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-accent-green mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
                      </svg>
                      +0.8%
                    </span>
                  </div>
                </div>

                {/* Driver 3 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#271E14] border border-accent-orange/20 flex items-center justify-center font-bold text-sm text-accent-orange">
                        ED
                      </div>
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-orange flex items-center justify-center text-[9px] font-bold text-white border-2 border-card-bg">
                        3
                      </span>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Emily Davis</p>
                      <p className="text-xs text-text-secondary mt-0.5">17 trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">94% Safety</p>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-accent-green mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
                      </svg>
                      +1.2%
                    </span>
                  </div>
                </div>

                {/* Driver 4 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#1A233A] border border-accent-blue/20 flex items-center justify-center font-bold text-sm text-accent-blue">
                        JW
                      </div>
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-orange flex items-center justify-center text-[9px] font-bold text-white border-2 border-card-bg">
                        4
                      </span>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">James Wilson</p>
                      <p className="text-xs text-text-secondary mt-0.5">15 trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">92% Safety</p>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-accent-green mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
                      </svg>
                      +0.4%
                    </span>
                  </div>
                </div>

                {/* Driver 5 */}
                <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#142A1D] border border-accent-green/20 flex items-center justify-center font-bold text-sm text-accent-green">
                        LP
                      </div>
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-accent-orange flex items-center justify-center text-[9px] font-bold text-white border-2 border-card-bg">
                        5
                      </span>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-text-primary">Lisa Park</p>
                      <p className="text-xs text-text-secondary mt-0.5">14 trips completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13.5px] font-bold text-text-primary">91% Safety</p>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-accent-green mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8L10 17l-4-4-6 6" />
                      </svg>
                      +0.9%
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
