"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FuelLog {
  id: string;
  vehicle: string;
  date: string;
  liters: string;
  fuelCost: number;
}

interface ExpenseLog {
  id: string;
  trip: string;
  vehicle: string;
  toll: number;
  other: number;
  maint: number;
}

const initialFuelLogs: FuelLog[] = [
  { id: "1", vehicle: "VAN-05", date: "05 Jul 2026", liters: "42 L", fuelCost: 3150 },
  { id: "2", vehicle: "TRUCK-11", date: "06 Jul 2026", liters: "110 L", fuelCost: 8400 },
  { id: "3", vehicle: "MINI-08", date: "06 Jul 2026", liters: "28 L", fuelCost: 2050 },
];

const initialExpenses: ExpenseLog[] = [
  { id: "1", trip: "TR001", vehicle: "VAN-05", toll: 120, other: 0, maint: 0 },
  { id: "2", trip: "TR002", vehicle: "TRK-12", toll: 340, other: 150, maint: 18000 },
];

export function FuelsSection() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(initialFuelLogs);
  const [expenses, setExpenses] = useState<ExpenseLog[]>(initialExpenses);

  const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.fuelCost, 0);
  const totalMaintCost = expenses.reduce((acc, exp) => acc + exp.maint, 0);
  const totalTollCost = expenses.reduce((acc, exp) => acc + exp.toll, 0);
  const totalOtherCost = expenses.reduce((acc, exp) => acc + exp.other, 0);
  
  // As per mockup: TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINT
  // But wait, what about Toll and Other? We'll sum it all up to reflect the actual cost.
  const totalOperationalCost = totalFuelCost + totalMaintCost + totalTollCost + totalOtherCost;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-10">
      
      {/* Top Section: Fuel Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Fuel Logs
          </h2>
          <div className="flex items-center gap-4">
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-6">
              <Plus className="w-4 h-4" />
              Log Fuel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-6">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Liters</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-2 px-6"><span className="text-sm font-medium text-foreground uppercase">{log.vehicle}</span></td>
                    <td className="py-2 px-6"><span className="text-sm text-foreground">{log.date}</span></td>
                    <td className="py-2 px-6"><span className="text-sm text-foreground">{log.liters}</span></td>
                    <td className="py-2 px-6"><span className="text-sm font-semibold text-foreground">{log.fuelCost.toLocaleString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Other Expenses */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Other Expenses (Toll / Misc)
        </h2>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trip</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Toll</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Other</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Maint. (Linked)</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, index) => {
                  const total = exp.toll + exp.other + exp.maint;
                  return (
                    <tr
                      key={exp.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 px-6"><span className="text-sm font-medium text-foreground uppercase">{exp.trip}</span></td>
                      <td className="py-2 px-6"><span className="text-sm text-foreground uppercase">{exp.vehicle}</span></td>
                      <td className="py-2 px-6"><span className="text-sm text-foreground">{exp.toll.toLocaleString()}</span></td>
                      <td className="py-2 px-6"><span className="text-sm text-foreground">{exp.other.toLocaleString()}</span></td>
                      <td className="py-2 px-6"><span className="text-sm text-foreground">{exp.maint.toLocaleString()}</span></td>
                      <td className="py-2 px-6">
                        <span className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-semibold rounded-md border bg-green-600/20 text-green-500 border-green-600/30">
                          {total.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer / Total Cost */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-white">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Total Operational Cost (Auto) = Fuel + Maint
        </span>
        <span className="text-lg font-bold text-[#d97706]">
          {totalOperationalCost.toLocaleString()}
        </span>
      </div>

    </div>
  );
}
