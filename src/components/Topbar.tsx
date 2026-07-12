"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("Fleet Manager");
  const [userInitials, setUserInitials] = useState<string>("FM");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    // Load the logged in role from localStorage
    const savedRole = localStorage.getItem("transitops_role");
    if (savedRole) {
      setUserRole(savedRole);
      // Map role to initials
      if (savedRole === "Fleet Manager") setUserInitials("FM");
      else if (savedRole === "Dispatcher") setUserInitials("DP");
      else if (savedRole === "Safety Officer") setUserInitials("SO");
      else if (savedRole === "Financial Analyst") setUserInitials("FA");
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("transitops_role");
    localStorage.removeItem("transitops_logged_in");
    router.push("/");
  };

  return (
    <header className="h-20 border-b border-sidebar-border bg-[#0A0B0F]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40 select-none">
      {/* Left side: Page Title & Context Pill */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
        
        {/* Date Context Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12141A] border border-card-border text-xs text-text-secondary font-medium">
          <svg className="w-3.5 h-3.5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Today</span>
        </div>
      </div>

      {/* Right side: Search, Notifications, Avatar */}
      <div className="flex items-center gap-5">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search fleet, trips, settings..."
            className="w-64 bg-[#12141A] border border-card-border rounded-full pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20 transition-all duration-200"
          />
        </div>

        {/* Notifications Icon */}
        <button className="relative w-10 h-10 rounded-full hover:bg-card-bg flex items-center justify-center transition-colors border border-transparent hover:border-card-border group">
          <svg className="w-5 h-5 text-text-secondary group-hover:text-text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification unread dot */}
          <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-accent-orange border border-sidebar-bg" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-sidebar-border" />

        {/* User initials avatar and dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-accent-blue hover:opacity-90 flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-offset-2 ring-offset-[#0A0B0F] ring-accent-blue/30 transition-all duration-200 cursor-pointer"
          >
            {userInitials}
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay background to close dropdown */}
              <div
                className="fixed inset-0 z-50"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2.5 w-56 rounded-xl bg-card-bg border border-card-border p-1.5 shadow-xl z-55 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-card-border/60">
                  <p className="text-xs text-text-secondary font-medium">Logged in as</p>
                  <p className="text-[13px] text-text-primary font-semibold truncate mt-0.5">{userRole}</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-text-secondary hover:text-text-primary hover:bg-[#1A1E26] flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/settings");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-text-secondary hover:text-text-primary hover:bg-[#1A1E26] flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </button>
                  <div className="h-px bg-card-border/60 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-accent-red hover:bg-[#2A1719]/40 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
