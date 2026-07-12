"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRole, setActiveRole] = useState<string>("Fleet Manager");

  // Admins state
  const [admins, setAdmins] = useState<Admin[]>([
    { id: "1", name: "Sarah Chen", email: "manager@transitops.com", role: "Fleet Manager" },
    { id: "2", name: "Mike Johnson", email: "dispatcher@transitops.com", role: "Dispatcher" },
    { id: "3", name: "Emily Davis", email: "safety@transitops.com", role: "Safety Officer" },
    { id: "4", name: "James Wilson", email: "finance@transitops.com", role: "Financial Analyst" },
  ]);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Fleet Manager");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("transitops_logged_in");
    if (loggedIn !== "true") {
      router.push("/");
    } else {
      setIsAuthenticated(true);
      const role = localStorage.getItem("transitops_role");
      if (role) {
        setActiveRole(role);
      }
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-app-bg text-text-primary flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-accent-blue" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Handle adding new admin
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!newName.trim() || !newEmail.trim()) {
      setFormError("All fields are required to add an administrator.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const newAdmin: Admin = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
      role: newRole,
    };

    setAdmins([newAdmin, ...admins]);
    setNewName("");
    setNewEmail("");
    setFormSuccess(`Successfully added ${newName} as a ${newRole}.`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setFormSuccess("");
    }, 3000);
  };

  // Handle deleting admin
  const handleDeleteAdmin = (id: string, name: string) => {
    setAdmins(admins.filter((admin) => admin.id !== id));
    setFormSuccess(`Removed ${name} from administrators.`);
    setTimeout(() => {
      setFormSuccess("");
    }, 3000);
  };

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case "Fleet Manager":
        return "bg-accent-blue/15 text-accent-blue border-accent-blue/20";
      case "Dispatcher":
        return "bg-accent-green/15 text-accent-green border-accent-green/20";
      case "Safety Officer":
        return "bg-accent-orange/15 text-accent-orange border-accent-orange/20";
      case "Financial Analyst":
        return "bg-accent-red/15 text-accent-red border-accent-red/20";
      default:
        return "bg-text-secondary/15 text-text-secondary border-text-secondary/20";
    }
  };

  const getRoleDotClasses = (role: string) => {
    switch (role) {
      case "Fleet Manager":
        return "bg-accent-blue";
      case "Dispatcher":
        return "bg-accent-green";
      case "Safety Officer":
        return "bg-accent-orange";
      case "Financial Analyst":
        return "bg-accent-red";
      default:
        return "bg-text-secondary";
    }
  };

  // RBAC matrix definition
  const roles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];
  const modules = [
    "Dashboard",
    "Fleet",
    "Drivers",
    "Trips",
    "Dispatching",
    "Maintenance",
    "Fuel & Expenses",
    "Analytics",
    "Settings",
  ];

  // Map role to module access checkmarks
  const rbacMatrix: Record<string, Record<string, boolean>> = {
    "Fleet Manager": {
      Dashboard: true,
      Fleet: true,
      Drivers: true,
      Trips: true,
      Dispatching: true,
      Maintenance: true,
      "Fuel & Expenses": true,
      Analytics: true,
      Settings: true,
    },
    Dispatcher: {
      Dashboard: true,
      Fleet: true,
      Drivers: true,
      Trips: true,
      Dispatching: true,
      Maintenance: false,
      "Fuel & Expenses": false,
      Analytics: true,
      Settings: false,
    },
    "Safety Officer": {
      Dashboard: true,
      Fleet: true,
      Drivers: true,
      Trips: true,
      Dispatching: false,
      Maintenance: true,
      "Fuel & Expenses": false,
      Analytics: true,
      Settings: false,
    },
    "Financial Analyst": {
      Dashboard: true,
      Fleet: false,
      Drivers: false,
      Trips: false,
      Dispatching: false,
      Maintenance: false,
      "Fuel & Expenses": true,
      Analytics: true,
      Settings: true,
    },
  };

  return (
    <div className="flex bg-app-bg min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar title="Settings" />

        {/* Inner Content Padding */}
        <main className="p-8 space-y-8 max-w-6xl">
          
          {/* Section 1: Admins card */}
          <section className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text-primary">Admins</h3>
              <p className="text-xs text-text-secondary mt-0.5">Manage administrative accounts and permissions</p>
            </div>

            {/* Inline Add Admin Form */}
            <form onSubmit={handleAddAdmin} className="bg-[#0A0B0F] border border-card-border/80 rounded-xl p-4.5 flex flex-col md:flex-row gap-3.5 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full bg-[#12141A] border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue/50"
                />
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. miller@transitops.com"
                  className="w-full bg-[#12141A] border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue/50"
                />
              </div>

              <div className="w-full md:w-48 space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Designated Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-[#12141A] border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 cursor-pointer"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-accent-blue hover:bg-accent-blue/90 text-white text-sm font-semibold px-5 py-2 rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-md cursor-pointer h-[38px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Admin</span>
              </button>
            </form>

            {/* Form Success/Error Alert messages */}
            {formError && (
              <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-accent-red">{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-accent-green/10 border border-accent-green/20 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-accent-green">{formSuccess}</span>
              </div>
            )}

            {/* Admins list */}
            <div className="divide-y divide-card-border/60">
              {admins.map((admin) => {
                const initials = admin.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                
                return (
                  <div key={admin.id} className="flex items-center justify-between py-4.5 first:pt-0 last:pb-0 group">
                    <div className="flex items-center gap-4">
                      {/* Avatar Circle */}
                      <div className={`w-10 h-10 rounded-full ${getRoleDotClasses(admin.role)}/15 border border-white/5 flex items-center justify-center text-sm font-bold text-[#F5F6F7]`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-bold text-text-primary">{admin.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{admin.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Role Status Pill */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeClasses(admin.role)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getRoleDotClasses(admin.role)}`} />
                        {admin.role}
                      </span>

                      {/* Delete Action button (Hidden by default, visible on hover) */}
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="w-8 h-8 rounded-lg hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20 flex items-center justify-center text-[#8B92A0] hover:text-accent-red opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                        title="Delete account"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Role-Based Access Control card */}
          <section className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-text-primary">Role-Based Access</h3>
              <p className="text-xs text-text-secondary mt-0.5">Permissions matrix mapped to user profiles</p>
            </div>

            {/* Permissions Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs font-semibold text-text-secondary">
                <thead>
                  <tr className="border-b border-card-border pb-3">
                    <th className="py-3 px-4 text-text-primary text-[11px] uppercase tracking-wider font-bold">Module Roles</th>
                    {modules.map((mod) => (
                      <th key={mod} className="py-3 px-2 text-center text-text-primary text-[10px] uppercase tracking-wider font-bold min-w-[80px]">
                        {mod}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/60">
                  {roles.map((role) => {
                    const isUserRole = activeRole === role;
                    return (
                      <tr
                        key={role}
                        className={`transition-colors border-transparent ${
                          isUserRole
                            ? "bg-[#1E293B]/20 hover:bg-[#1E293B]/30 border-y border-accent-blue/20"
                            : "hover:bg-[#12141A]/50"
                        }`}
                      >
                        <td className="py-4 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary">{role}</span>
                            {isUserRole && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-blue/15 text-accent-blue border border-accent-blue/25 uppercase tracking-wide">
                                Active Profile
                              </span>
                            )}
                          </div>
                        </td>
                        {modules.map((mod) => {
                          const hasAccess = rbacMatrix[role]?.[mod] ?? false;
                          return (
                            <td key={mod} className="py-4 px-2 text-center">
                              {hasAccess ? (
                                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-green/10 border border-accent-green/20">
                                  <svg className="w-3.5 h-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <span className="text-text-secondary/35 text-sm font-medium">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note on settings profile access */}
            <div className="p-3 bg-[#1A1E26]/40 rounded-lg flex gap-3">
              <svg className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[11px] font-medium text-text-secondary leading-relaxed">
                <span className="text-text-primary font-bold">Note on role access limits:</span> The permission matrix is read-only.
                Module access rights correspond to navigation features. If logged in as a profile without Settings or Maintenance module access,
                the respective paths in sidebar navigation are marked, but access restrictions apply. You can sign out and sign in as different profiles using the <span className="text-accent-blue">Quick Roles Login</span> panel.
              </p>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
