"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Section = "overview" | "pipeline" | "deals" | "customers" | "team" | "forecasting" | "reports" | "settings";

interface RoleConfig {
  name: string;
  email: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roles: RoleConfig[] = [
    {
      name: "Fleet Manager",
      email: "manager@transitops.com",
      dotColor: "bg-accent-blue",
      borderColor: "border-accent-blue/20",
      bgColor: "bg-accent-blue/10",
    },
    {
      name: "Dispatcher",
      email: "dispatcher@transitops.com",
      dotColor: "bg-accent-green",
      borderColor: "border-accent-green/20",
      bgColor: "bg-accent-green/10",
    },
    {
      name: "Safety Officer",
      email: "safety@transitops.com",
      dotColor: "bg-accent-orange",
      borderColor: "border-accent-orange/20",
      bgColor: "bg-accent-orange/10",
    },
    {
      name: "Financial Analyst",
      email: "finance@transitops.com",
      dotColor: "bg-accent-red",
      borderColor: "border-accent-red/20",
      bgColor: "bg-accent-red/10",
    },
  ];

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("transitops_logged_in");
    if (isLoggedIn === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleRoleSelect = (role: RoleConfig) => {
    setEmail(role.email);
    setPassword("password123");
    setSelectedRole(role.name);
    setErrorMessage("");
    setIsDropdownOpen(false);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password fields.");
      return;
    }

    setIsLoading(true);

    // Simulate login verification
    setTimeout(() => {
      // Find if email matches any role
      const matchedRole = roles.find((r) => r.email.toLowerCase() === email.toLowerCase());
      
      if (matchedRole) {
        localStorage.setItem("transitops_logged_in", "true");
        localStorage.setItem("transitops_role", matchedRole.name);
        router.push("/dashboard");
      } else if (email === "admin@transitops.com" && password === "admin") {
        localStorage.setItem("transitops_logged_in", "true");
        localStorage.setItem("transitops_role", "Fleet Manager");
        router.push("/dashboard");
      } else {
        setIsLoading(false);
        setErrorMessage("Invalid credentials. Try selecting a quick role below.");
      }
    }, 800);
  };

  const getRoleDotColor = (roleName: string) => {
    const r = roles.find((role) => role.name === roleName);
    return r ? r.dotColor : "bg-[#8B92A0]";
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-[#F5F6F7] flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Dynamic Background Glowing Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent-green/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-[#12141A] border border-[#1E2028] rounded-xl p-8 z-10 relative shadow-2xl">
        {/* Logo and Wordmark */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0D0F14] border border-[#1C1F26] flex items-center justify-center shadow-lg mb-3">
            <svg className="w-6 h-6 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-wider text-[#F5F6F7]">TransitOps</h2>
          <p className="text-xs text-[#8B92A0] mt-1">Sign in to your account</p>
        </div>

        {/* Custom Role Selector Dropdown */}
        <div className="mb-5 relative">
          <label className="block text-xs font-semibold text-[#8B92A0] uppercase tracking-wider mb-2">
            Select Profile Role
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[#0A0B0F] border border-[#1E2028] rounded-lg px-4 py-2.5 text-sm text-left flex items-center justify-between text-[#F5F6F7] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all duration-200 cursor-pointer"
          >
            {selectedRole ? (
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getRoleDotColor(selectedRole)}`} />
                <span className="font-medium">{selectedRole}</span>
              </span>
            ) : (
              <span className="text-[#8B92A0]">Choose a profile role to prefill...</span>
            )}
            <svg className={`w-4 h-4 text-[#8B92A0] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute w-full mt-2 bg-[#0D0F14] border border-[#1E2028] rounded-lg shadow-2xl p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {roles.map((role) => (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm text-[#8B92A0] hover:text-[#F5F6F7] hover:bg-[#12141A] border border-transparent hover:border-[#1E2028]/60 flex items-center gap-2.5 transition-all duration-150 cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full ${role.dotColor}`} />
                    <span className="font-semibold">{role.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Divider line */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px bg-[#1E2028]/60 flex-1" />
          <span className="text-[9px] font-bold text-[#8B92A0] uppercase tracking-widest">Or enter email</span>
          <div className="h-px bg-[#1E2028]/60 flex-1" />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#8B92A0] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#8B92A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="name@transitops.com"
                className="w-full bg-[#0A0B0F] border border-[#1E2028] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F5F6F7] placeholder-[#8B92A0] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-[#8B92A0] uppercase tracking-wider">
                Password
              </label>
              <a
                href="#forgot"
                className="text-xs font-medium text-[#3B82F6] hover:text-[#3B82F6]/80 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  setErrorMessage("Password reset is disabled in demo mode. Please select a quick role.");
                }}
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#8B92A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="••••••••"
                className="w-full bg-[#0A0B0F] border border-[#1E2028] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#F5F6F7] placeholder-[#8B92A0] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded bg-[#0A0B0F] border-[#1E2028] text-[#3B82F6] focus:ring-offset-0 focus:ring-[#3B82F6]/20 accent-[#3B82F6]"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-[#8B92A0] cursor-pointer select-none">
              Remember me on this device
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Space for Error Messages */}
        <div className={`transition-all duration-300 ${errorMessage ? "opacity-100 h-10 mt-5" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-2.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#EF4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium text-[#EF4444] truncate">{errorMessage}</span>
          </div>
        </div>
      </div>

      {/* Role Pill Tags Footer (Linked to select for fallback/quick accessibility) */}
      <div className="mt-8 z-10 w-full max-w-[440px] text-center">
        <div className="w-full flex items-center justify-between gap-3 mb-3">
          <div className="h-px bg-[#1E2028]/60 flex-1" />
          <span className="text-[10px] font-semibold text-[#8B92A0] uppercase tracking-widest px-2">
            Quick Roles Login
          </span>
          <div className="h-px bg-[#1E2028]/60 flex-1" />
        </div>
        
        <div className="flex flex-wrap justify-center gap-2.5">
          {roles.map((role) => {
            const isActive = selectedRole === role.name;
            return (
              <button
                key={role.name}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${role.bgColor} ${role.borderColor} ${
                  isActive
                    ? "ring-2 ring-white/10 opacity-100 scale-105"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} />
                <span className="text-[#F5F6F7]">{role.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
