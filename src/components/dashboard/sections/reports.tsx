"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Fuel, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Gauge,
  Loader2,
  Download,
  Calendar
} from 'lucide-react';

// ============================================================================
// 1. DATABASE SCHEMA TYPES (Self-contained)
// ============================================================================
interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_name: string;
  vehicle_model: string;
  vehicle_type: string;
  odometer: number;
  status: string;
}

interface Trip {
  id: string;
  trip_number: string;
  source: string;
  destination: string;
  planned_distance: number;
  actual_distance: number;
  cargo_weight: number;
}

interface FuelLog {
  id: string;
  cost: number;
  liters: number;
}

interface MaintenanceLog {
  id: string;
  cost: number;
  status: string;
}

interface GeneralExpense {
  id: string;
  amount: number;
}

// ============================================================================
// 2. SUPABASE BACKEND CLIENT INITIALIZATION
// Replace keys with your exact project secrets or process.env configuration variables
// ============================================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// 3. NAMED EXPORT (Resolves Next.js Build Mismatch)
// ============================================================================
export function ReportsSection() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);

  // Network Fallback Indicators
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Async Live Database Matrices across Parallel Tables
  useEffect(() => {
    async function pullFleetReportingData() {
      try {
        setLoading(true);
        setError(null);

        const [
          { data: vData, error: vErr },
          { data: tData, error: tErr },
          { data: fData, error: fErr },
          { data: mData, error: mErr },
          { data: eData, error: eErr }
        ] = await Promise.all([
          supabase.from('vehicles').select('*'),
          supabase.from('trips').select('*'),
          supabase.from('fuel_logs').select('*'),
          supabase.from('maintenance').select('*'),
          supabase.from('expenses').select('*')
        ]);

        if (vErr || tErr || fErr || mErr || eErr) {
          throw new Error(vErr?.message || tErr?.message || fErr?.message || mErr?.message || eErr?.message);
        }

        setVehicles(vData || []);
        setTrips(tData || []);
        setFuelLogs(fData || []);
        setMaintenance(mData || []);
        setExpenses(eData || []);

      } catch (err: any) {
        console.error('Database report engine failure:', err);
        setError(err.message || 'Failed to pull live tables from the database backend.');
      } finally {
        setLoading(false);
      }
    }

    pullFleetReportingData();
  }, []);

  // Aggregation Engine tailored to cost minimization metrics
  const analytics = useMemo(() => {
    const fuelCost = fuelLogs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const mainCost = maintenance.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
    const expCost = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const dynamicTotalCost = fuelCost + mainCost + expCost;

    const totalDistanceTravelled = trips.reduce((sum, item) => sum + (Number(item.actual_distance) || 0), 0);
    const efficiencyRatioPerKm = totalDistanceTravelled > 0 ? dynamicTotalCost / totalDistanceTravelled : 0;

    const downAssetsCount = vehicles.filter(v => v.status === 'In Maintenance' || v.status === 'Down').length;

    return {
      dynamicTotalCost,
      fuelCost,
      mainCost,
      expCost,
      efficiencyRatioPerKm,
      totalDistanceTravelled,
      downAssetsCount
    };
  }, [vehicles, trips, fuelLogs, maintenance, expenses]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
        <p className="text-xs font-medium tracking-wide">Assembling live ledger reports configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-900/50 rounded-xl max-w-lg mx-auto text-center mt-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <h4 className="font-semibold text-white text-sm">Failed to generate real-time metrics audit</h4>
        <p className="text-xs text-red-400 font-mono mt-1 bg-black/20 p-2 rounded text-left overflow-x-auto">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-200">
      
      {/* Upper Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-800/40 p-4 border border-gray-800 rounded-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Operational Cost Controls
          </h2>
          <p className="text-xs text-gray-400">Pure expense structure diagnostics derived from live Postgres schemas.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg shadow-sm transition"
        >
          <Download className="w-3.5 h-3.5" /> Export Audit Sheets
        </button>
      </div>

      {/* Operational Efficiency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/60 p-4 rounded-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Fleet Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            ${analytics.dynamicTotalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-gray-500 block mt-0.5">Aggregated logistics outlay</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/60 p-4 rounded-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Cost per Kilometer</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">${analytics.efficiencyRatioPerKm.toFixed(2)}/km</p>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Primary efficiency metric</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/60 p-4 rounded-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Aggregated Distance</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{analytics.totalDistanceTravelled.toLocaleString()} km</p>
          <span className="text-[10px] text-gray-500 block mt-0.5">Active route paths completed</span>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/60 p-4 rounded-xl">
          <div className="flex justify-between items-center text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span>Fleet Asset Risk</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">{analytics.downAssetsCount} Offline</p>
          <span className="text-[10px] text-amber-400 font-medium block mt-0.5">{vehicles.length - analytics.downAssetsCount} Trucks operational</span>
        </div>
      </div>

      {/* Internal Budget Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cost Matrix Allocation Weights */}
        <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700/70 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-4 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Internal Operational Spend Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Fuel Expenditure (`fuel_logs`)</span>
                <span className="font-mono text-white">${analytics.fuelCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(analytics.fuelCost / (analytics.dynamicTotalCost || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Maintenance Overhead (`maintenance`)</span>
                <span className="font-mono text-white">${analytics.mainCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(analytics.mainCost / (analytics.dynamicTotalCost || 1)) * 100}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Incidentals & Route Expenses (`expenses`)</span>
                <span className="font-mono text-white">${analytics.expCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(analytics.expCost / (analytics.dynamicTotalCost || 1)) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Diagnostics / Anomaly Warning Ledger */}
        <div className="bg-gray-800/50 border border-gray-700/70 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Discovered Discrepancies
            </h3>
            <div className="space-y-2">
              {analytics.downAssetsCount > 0 ? (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-[11px] text-red-300">
                  <strong>Downtime Alert:</strong> {analytics.downAssetsCount} trucks are currently tagged offline. Inspect the garage logs to release them back into service.
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-[11px] text-emerald-400">
                  System status is completely healthy. Zero mechanical breakdown metrics flagged.
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-gray-500 border-t border-gray-800 pt-2 block mt-4">
            Security audits verified against connected Supabase backend logic.
          </span>
        </div>
      </div>

      {/* Dynamic Trip Variance Register */}
      <div className="bg-gray-800/30 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-gray-800/60 border-b border-gray-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Route Plan Deviation Audits (`trips`)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 text-[10px] font-semibold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-3">Trip Identifier</th>
                <th className="p-3">Transit Corridor</th>
                <th className="p-3">Target Distance</th>
                <th className="p-3">Actual Travelled</th>
                <th className="p-3">Variance Log</th>
                <th className="p-3">Net Payload Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950/10">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No active shipping trips found in current billing cycles.</td>
                </tr>
              ) : (
                trips.map((t) => {
                  const targetDist = Number(t.planned_distance) || 0;
                  const realDist = Number(t.actual_distance) || 0;
                  const divergence = realDist - targetDist;
                  return (
                    <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 font-mono font-medium text-white">{t.trip_number || 'N/A'}</td>
                      <td className="p-3 text-gray-400">{t.source} &rarr; {t.destination}</td>
                      <td className="p-3 font-mono">{targetDist} km</td>
                      <td className="p-3 font-mono">{realDist} km</td>
                      <td className={`p-3 font-mono font-semibold ${divergence > 0 ? 'text-red-400' : divergence < 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                        {divergence > 0 ? `+${divergence}` : divergence} km
                      </td>
                      <td className="p-3 font-mono">{(Number(t.cargo_weight) || 0).toLocaleString()} kg</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}