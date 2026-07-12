  "use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states
  const [newFuelLog, setNewFuelLog] = useState<Partial<FuelLog>>({});
  const [newExpense, setNewExpense] = useState<Partial<ExpenseLog>>({});

  const handleLogFuel = () => {
    if (!newFuelLog.vehicle || !newFuelLog.fuelCost) return;
    
    setFuelLogs([
      {
        id: Math.random().toString(),
        vehicle: newFuelLog.vehicle,
        date: newFuelLog.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        liters: newFuelLog.liters || "0 L",
        fuelCost: Number(newFuelLog.fuelCost),
      },
      ...fuelLogs,
    ]);
    setIsFuelModalOpen(false);
    setNewFuelLog({});
  };

  const handleAddExpense = () => {
    if (!newExpense.trip || !newExpense.vehicle) return;

    setExpenses([
      {
        id: Math.random().toString(),
        trip: newExpense.trip,
        vehicle: newExpense.vehicle,
        toll: Number(newExpense.toll) || 0,
        other: Number(newExpense.other) || 0,
        maint: Number(newExpense.maint) || 0,
      },
      ...expenses,
    ]);
    setIsExpenseModalOpen(false);
    setNewExpense({});
  };

  const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.fuelCost, 0);
  const totalMaintCost = expenses.reduce((acc, exp) => acc + exp.maint, 0);
  const totalTollCost = expenses.reduce((acc, exp) => acc + exp.toll, 0);
  const totalOtherCost = expenses.reduce((acc, exp) => acc + exp.other, 0);
  
  // As per mockup: TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINT
  // We'll sum it all up to reflect the actual operational costs displayed
  const totalOperationalCost = totalFuelCost + totalMaintCost + totalTollCost + totalOtherCost;
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full pb-10">
      
      {/* Top Section: Fuel Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Fuel Logs
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {/* Log Fuel Dialog */}
            <Dialog open={isFuelModalOpen} onOpenChange={setIsFuelModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Log Fuel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Log Fuel</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuel-vehicle" className="text-right text-muted-foreground">Vehicle</Label>
                    <Input
                      id="fuel-vehicle"
                      placeholder="e.g. VAN-05"
                      className="col-span-3 bg-background"
                      value={newFuelLog.vehicle || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, vehicle: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right text-muted-foreground">Date</Label>
                    <Input
                      id="date"
                      placeholder="e.g. 05 Jul 2026"
                      className="col-span-3 bg-background"
                      value={newFuelLog.date || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="liters" className="text-right text-muted-foreground">Liters</Label>
                    <Input
                      id="liters"
                      placeholder="e.g. 42 L"
                      className="col-span-3 bg-background"
                      value={newFuelLog.liters || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, liters: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="fuelCost" className="text-right text-muted-foreground">Fuel Cost</Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      placeholder="3150"
                      className="col-span-3 bg-background"
                      value={newFuelLog.fuelCost || ""}
                      onChange={(e) => setNewFuelLog({ ...newFuelLog, fuelCost: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsFuelModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleLogFuel} className="bg-primary text-primary-foreground">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Expense Dialog */}
            <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold gap-2 shadow-lg h-10 px-5 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Add Expense</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="trip" className="text-right text-muted-foreground">Trip</Label>
                    <Input
                      id="trip"
                      placeholder="e.g. TR001"
                      className="col-span-3 bg-background"
                      value={newExpense.trip || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, trip: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="exp-vehicle" className="text-right text-muted-foreground">Vehicle</Label>
                    <Input
                      id="exp-vehicle"
                      placeholder="e.g. VAN-05"
                      className="col-span-3 bg-background"
                      value={newExpense.vehicle || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, vehicle: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="toll" className="text-right text-muted-foreground">Toll Cost</Label>
                    <Input
                      id="toll"
                      type="number"
                      placeholder="120"
                      className="col-span-3 bg-background"
                      value={newExpense.toll || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, toll: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="other" className="text-right text-muted-foreground">Other Cost</Label>
                    <Input
                      id="other"
                      type="number"
                      placeholder="0"
                      className="col-span-3 bg-background"
                      value={newExpense.other || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, other: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                    <Label htmlFor="maint" className="text-right text-muted-foreground">Maint. Cost</Label>
                    <Input
                      id="maint"
                      type="number"
                      placeholder="0"
                      className="col-span-3 bg-background"
                      value={newExpense.maint || ""}
                      onChange={(e) => setNewExpense({ ...newExpense, maint: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddExpense} className="bg-primary text-primary-foreground">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Liters</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm font-medium text-foreground uppercase">{log.vehicle}</span></td>
                    <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground">{log.date}</span></td>
                    <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground">{log.liters}</span></td>
                    <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm font-semibold text-foreground">{log.fuelCost.toLocaleString()}</span></td>
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
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Trip</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Toll</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Other</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Maint. (Linked)</th>
                  <th className="text-left py-2 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const total = exp.toll + exp.other + exp.maint;
                  return (
                    <tr
                      key={exp.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm font-medium text-foreground uppercase">{exp.trip}</span></td>
                      <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground uppercase">{exp.vehicle}</span></td>
                      <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground">{exp.toll.toLocaleString()}</span></td>
                      <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground">{exp.other.toLocaleString()}</span></td>
                      <td className="py-2 px-6 whitespace-nowrap"><span className="text-sm text-foreground">{exp.maint.toLocaleString()}</span></td>
                      <td className="py-2 px-6 whitespace-nowrap">
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
      <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0 pt-4 border-t border-border">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left">
          Total Operational Cost (Auto) = Fuel + Maint
        </span>
        <span className="text-lg font-bold text-[#d97706]">
          {totalOperationalCost.toLocaleString()}
        </span>
      </div>

    </div>
  );
}
