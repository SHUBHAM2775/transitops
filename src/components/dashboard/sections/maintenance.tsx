"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface ServiceRecord {
  id: string;
  vehicle: string;
  service: string;
  cost: string;
  date: string;
  status: "In Shop" | "Completed";
}

const initialRecords: ServiceRecord[] = [
  { id: "1", vehicle: "VAN-05", service: "Oil Change", cost: "2,500", date: "07/07/2026", status: "In Shop" },
  { id: "2", vehicle: "TRUCK-11", service: "Engine Repair", cost: "18,000", date: "05/07/2026", status: "Completed" },
  { id: "3", vehicle: "MINI-03", service: "Tyre Replace", cost: "6,200", date: "02/07/2026", status: "In Shop" },
];

export function MaintenanceSection() {
  const [records, setRecords] = useState<ServiceRecord[]>(initialRecords);
  
  const [newRecord, setNewRecord] = useState<Partial<ServiceRecord>>({
    status: "Active" as any // User typed Active in mockup, so we just use that as a string for UI before saving
  });

  const handleSave = () => {
    if (!newRecord.vehicle || !newRecord.service) return;
    
    setRecords([
      {
        id: Math.random().toString(),
        vehicle: newRecord.vehicle,
        service: newRecord.service,
        cost: newRecord.cost || "0",
        date: newRecord.date || new Date().toLocaleDateString(),
        status: (newRecord.status === "Completed" ? "Completed" : "In Shop"),
      },
      ...records,
    ]);
    
    setNewRecord({ status: "Active" as any, vehicle: "", service: "", cost: "", date: "" });
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      
      {/* Left Column: Form */}
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
            Log Service Record
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle" className="text-xs uppercase text-muted-foreground tracking-wider">Vehicle</Label>
              <Input
                id="vehicle"
                placeholder="VAN-05"
                className="bg-background border-border"
                value={newRecord.vehicle || ""}
                onChange={(e) => setNewRecord({ ...newRecord, vehicle: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="service" className="text-xs uppercase text-muted-foreground tracking-wider">Service Type</Label>
              <Input
                id="service"
                placeholder="Oil Change"
                className="bg-background border-border"
                value={newRecord.service || ""}
                onChange={(e) => setNewRecord({ ...newRecord, service: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost" className="text-xs uppercase text-muted-foreground tracking-wider">Cost</Label>
              <Input
                id="cost"
                placeholder="2500"
                className="bg-background border-border"
                value={newRecord.cost || ""}
                onChange={(e) => setNewRecord({ ...newRecord, cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs uppercase text-muted-foreground tracking-wider">Date</Label>
              <Input
                id="date"
                placeholder="07/07/2026"
                className="bg-background border-border"
                value={newRecord.date || ""}
                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs uppercase text-muted-foreground tracking-wider">Status</Label>
              <Input
                id="status"
                placeholder="Active"
                className="bg-background border-border"
                value={newRecord.status || ""}
                onChange={(e) => setNewRecord({ ...newRecord, status: e.target.value as any })}
              />
            </div>

            <Button 
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-black font-medium h-10 mt-4 transition-colors"
            >
              Save
            </Button>
          </div>
        </div>

        {/* Legend / Rules */}
        <div className="pt-8 space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-green-500 font-semibold w-16 text-sm">Available</span>
            <div className="flex-1 flex items-center justify-center relative h-6">
              <div className="w-full h-px bg-muted-foreground/40 absolute top-1/2 -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-muted-foreground/40 rotate-45"></div>
              <span className="text-muted-foreground text-[10px] bg-[#020204] px-2 relative z-10">creating active record</span>
            </div>
            <span className="text-[#d97706] font-semibold w-16 text-sm text-right">In Shop</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#d97706] font-semibold w-16 text-sm">In Shop</span>
            <div className="flex-1 flex items-center justify-center relative h-6">
              <div className="w-full h-px bg-muted-foreground/40 absolute top-1/2 -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-muted-foreground/40 rotate-45"></div>
              <span className="text-muted-foreground text-[10px] bg-[#020204] px-2 relative z-10">closing record (not active)</span>
            </div>
            <span className="text-green-500 font-semibold w-16 text-sm text-right">Available</span>
          </div>

          <p className="text-[#d97706] text-xs font-medium">
            Note: In Shop vehicles are removed from the dispatch pool.
          </p>
        </div>
      </div>

      {/* Right Column: Table */}
      <div>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Service Log
          </h2>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-fit">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        No service records.
                      </td>
                    </tr>
                  ) : (
                    records.map((record, index) => (
                      <tr
                        key={record.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                      >
                        <td className="py-4 px-6 font-medium text-foreground">{record.vehicle}</td>
                        <td className="py-4 px-6 text-foreground">{record.service}</td>
                        <td className="py-4 px-6 font-semibold text-foreground">{record.cost}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold rounded-md border ${
                            record.status === 'Completed' 
                              ? 'bg-green-600/20 text-green-500 border-green-600/30' 
                              : 'bg-[#d97706]/20 text-[#d97706] border-[#d97706]/30'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => handleDelete(record.id)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
