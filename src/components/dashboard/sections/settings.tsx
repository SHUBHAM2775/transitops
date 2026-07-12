"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const RbacSelect = ({ initialValue }: { initialValue: "Full" | "View" | "None" }) => {
  const [value, setValue] = useState(initialValue);
  
  return (
    <Select value={value} onValueChange={(val) => setValue(val as "Full" | "View" | "None")}>
      <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-transparent hover:border-border hover:bg-background mx-auto focus:ring-0 shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Full">Full (✓)</SelectItem>
        <SelectItem value="View">View</SelectItem>
        <SelectItem value="None">None (-)</SelectItem>
      </SelectContent>
    </Select>
  );
};

export function SettingsSection() {
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [safetyWarnings, setSafetyWarnings] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Profile Form States
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Fleet Manager");
  const [userEmail, setUserEmail] = useState("manager@transitops.com");
  
  // Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Status Indicators
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        
        // Fetch only name and role from the users table now
        const { data: profile } = await supabase
          .from("users")
          .select("name, role")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          if (profile.name) setUserName(profile.name);
          if (profile.role) setUserRole(profile.role);
        }
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. Update text metadata fields in your database table
      const { error: profileError } = await supabase
        .from("users")
        .update({
          name: userName,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 2. Handle Password Upgrades securely (if the user typed something)
      if (newPassword) {
        if (!oldPassword) {
          throw new Error("You must provide your old password to set a new one.");
        }
        if (newPassword.length < 6) {
          throw new Error("Your new password must be at least 6 characters long.");
        }

        // Re-authenticate user to confirm old password matches before allowing changes
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: oldPassword,
        });

        if (reauthError) {
          throw new Error("Verification failed: The old password you entered is incorrect.");
        }

        // Apply new password changes to Supabase Auth core
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) throw passwordError;
        
        // Wipe inputs on a clean save
        setOldPassword("");
        setNewPassword("");
      }

      setSuccessMessage("Profile configuration saved successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred processing your request.");
    } finally {
      setIsUpdating(false);
    }
  };

  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 h-full">
      
      {/* Top Profile Section */}
      <form onSubmit={handleUpdateProfile} className="bg-[#020204] border border-border p-6 rounded-md shadow-sm">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-8">Profile Settings</h2>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 border-b border-border pb-8 mb-8">
          {/* Avatar and Upload Button */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-32 h-32 rounded-full bg-green-600 text-black text-5xl font-bold shadow-lg">
              {userInitials}
            </div>
            <div className="relative">
              <input type="file" accept="image/*" className="hidden" id="avatar-upload" />
              <Label htmlFor="avatar-upload" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium px-4 py-2 rounded-md transition-colors border border-border inline-block">
                Change Avatar
              </Label>
            </div>
          </div>
          
          {/* Input Fields Beside Avatar */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
              <Input 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                className="bg-background border-border h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email Address</Label>
              <Input value={userEmail} className="bg-background border-border h-11" readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Role</Label>
              <Input value={userRole.replace('_', ' ')} className="bg-background border-border h-11 capitalize" readOnly disabled />
            </div>
            <div className="space-y-2 md:col-start-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Old Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-background border-border h-11" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">New Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background border-border h-11" 
              />
            </div>
          </div>
        </div>
        
        {/* Alerts and Status Responses */}
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-medium max-w-md ml-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-500 text-xs font-medium max-w-md ml-auto">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-black font-semibold px-8 h-10 transition-colors shadow-lg flex items-center gap-2"
            >
              {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUpdating ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: GENERAL & PREFERENCES */}
        <div className="space-y-10">
          
          {/* General Settings */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">General</h2>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Depot Name</Label>
                <Input defaultValue="Gandhinagar Depot GJ4" className="bg-[#020204] border-border h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Currency</Label>
                <Input defaultValue="INR (Rs)" className="bg-[#020204] border-border h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Distance Unit</Label>
                <Input defaultValue="Kilometers" className="bg-[#020204] border-border h-11" />
              </div>
            </div>

            <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold px-8 h-10 mt-2 transition-colors shadow-lg">
              Save changes
            </Button>
          </div>

          {/* System Preferences */}
          <div className="space-y-6 pt-2 border-t border-border/50">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">System Preferences</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#020204] border border-border rounded-md shadow-sm">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Maintenance Alerts</h4>
                  <p className="text-xs text-muted-foreground mt-1">Receive notifications for upcoming scheduled maintenance</p>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${maintenanceAlerts ? 'bg-green-600' : 'bg-secondary'}`}
                  onClick={() => setMaintenanceAlerts(!maintenanceAlerts)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${maintenanceAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#020204] border border-border rounded-md shadow-sm">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Driver Safety Warnings</h4>
                  <p className="text-xs text-muted-foreground mt-1">Immediate alerts when a driver's safety score drops</p>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${safetyWarnings ? 'bg-green-600' : 'bg-secondary'}`}
                  onClick={() => setSafetyWarnings(!safetyWarnings)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${safetyWarnings ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#020204] border border-border rounded-md shadow-sm">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Dark Mode</h4>
                  <p className="text-xs text-muted-foreground mt-1">Enforce dark theme across all dispatcher terminals</p>
                </div>
                <div 
                  className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${darkMode ? 'bg-green-600' : 'bg-secondary'}`}
                  onClick={() => setDarkMode(!darkMode)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: RBAC Table */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Role-Based Access (RBAC)</h2>
          
          <div className="bg-[#020204] border border-border rounded-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="py-4 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="py-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Fleet</th>
                    <th className="py-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Drivers</th>
                    <th className="py-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Trips</th>
                    <th className="py-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Fuel/Exp.</th>
                    <th className="py-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-5 text-sm font-medium whitespace-nowrap">Fleet Manager</td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                  </tr>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-5 text-sm font-medium whitespace-nowrap">Dispatcher</td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="View" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                  </tr>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-5 text-sm font-medium whitespace-nowrap">Safety Officer</td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="View" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                  </tr>
                  <tr className="hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-5 text-sm font-medium whitespace-nowrap">Financial Analyst</td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="View" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="None" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                    <td className="py-2 px-2 text-center"><RbacSelect initialValue="Full" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-xs text-[#EAB308] mt-4 opacity-90 italic">
            Note: RBAC permissions determine module visibility on the sidebar and action constraints.
          </div>
        </div>

      </div>
    </div>
  );
}