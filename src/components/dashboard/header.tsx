"use client";

import { cn } from "@/lib/utils";
import type { Section } from "@/app/dashboard/page";
import { Bell, Search, Calendar, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  activeSection: Section;
}

const sectionTitles: Record<Section, string> = {
  dashboard: "Dashboard",
  fleet: "Fleet",
  drivers: "Drivers",
  trips: "Trips",
  maintenance: "Maintenance",
  fuel_expense: "Fuel & Expense",
  analytics: "Analytics",
  settings: "Settings",
};

export function Header({ activeSection }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();
  
  const [userRole, setUserRole] = useState("Sales Manager");
  const [userEmail, setUserEmail] = useState("manager@salesops.com");

  useEffect(() => {
    const role = localStorage.getItem("transitops_role");
    if (role) {
      setUserRole(role);
      if (role === "Account Executive") setUserEmail("ae@salesops.com");
      else if (role === "SDR") setUserEmail("sdr@salesops.com");
      else if (role === "Financial Analyst") setUserEmail("finance@salesops.com");
      else setUserEmail("manager@salesops.com");
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("transitops_logged_in");
    localStorage.removeItem("transitops_role");
    router.push("/");
  };

  const userInitials = userRole.substring(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-foreground">
          {sectionTitles[activeSection]}
        </h1>
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Last 30 days</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div
          className={cn(
            "relative flex items-center transition-all duration-300",
            searchFocused ? "w-64" : "w-48"
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full animate-pulse" />
        </button>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-lg overflow-hidden bg-secondary ring-2 ring-transparent hover:ring-accent/50 transition-all duration-200 outline-none">
              <div className="w-full h-full bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-xs font-semibold text-accent-foreground">
                {userInitials}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userRole}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
