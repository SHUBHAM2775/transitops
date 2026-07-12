"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { DashboardSection } from "@/components/dashboard/sections/dashboard";
import { FleetSection } from "@/components/dashboard/sections/fleet";
import { DriversSection } from "@/components/dashboard/sections/drivers";
import { TripsSection } from "@/components/dashboard/sections/trips";
import { MaintenanceSection } from "@/components/dashboard/sections/maintenance";
import { FuelsSection } from "@/components/dashboard/sections/fuels";
import { ReportsSection } from "@/components/dashboard/sections/reports";
import { SettingsSection } from "@/components/dashboard/sections/settings";

export type Section = "dashboard" | "fleet" | "drivers" | "trips" | "maintenance" | "fuel_expense" | "analytics" | "settings";

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="min-h-screen bg-[#020204] text-[#F5F6F7] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#3B82F6]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardSection />;
      case "fleet":
        return <FleetSection />;
      case "drivers":
        return <DriversSection />;
      case "trips":
        return <TripsSection />;
      case "maintenance":
        return <MaintenanceSection />;
      case "fuel_expense":
        return <FuelsSection />;
      case "analytics":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground capitalize">{(activeSection as string).replace('_', ' ')} Section</h2>
              <p className="text-muted-foreground mt-2">This module is currently under construction.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020204] overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          setMobileMenuOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ml-0 ${
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
        }`}
      >
        <Header activeSection={activeSection} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0 w-full">
          <div
            key={activeSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full w-full"
          >
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}