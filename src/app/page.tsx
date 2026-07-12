"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleDollarSign, ChevronDown, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

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
      name: "Sales Manager",
      email: "manager@salesops.com",
      dotColor: "bg-chart-1",
      borderColor: "border-chart-1/20",
      bgColor: "bg-chart-1/10",
    },
    {
      name: "Account Executive",
      email: "ae@salesops.com",
      dotColor: "bg-chart-2",
      borderColor: "border-chart-2/20",
      bgColor: "bg-chart-2/10",
    },
    {
      name: "SDR",
      email: "sdr@salesops.com",
      dotColor: "bg-chart-3",
      borderColor: "border-chart-3/20",
      bgColor: "bg-chart-3/10",
    },
    {
      name: "Financial Analyst",
      email: "finance@salesops.com",
      dotColor: "bg-chart-4",
      borderColor: "border-chart-4/20",
      bgColor: "bg-chart-4/10",
    },
  ];

  // If already logged in, redirect to dashboard
  // Removed so we don't automatically redirect, allowing you to preview the login page
  /* useEffect(() => {
    const isLoggedIn = localStorage.getItem("transitops_logged_in");
    if (isLoggedIn === "true") {
      router.push("/dashboard");
    }
  }, [router]); */

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
      } else if (email === "admin@salesops.com" && password === "admin") {
        localStorage.setItem("transitops_logged_in", "true");
        localStorage.setItem("transitops_role", "Sales Manager");
        router.push("/dashboard");
      } else {
        setIsLoading(false);
        setErrorMessage("Invalid credentials. Try selecting a quick role below.");
      }
    }, 800);
  };

  const getRoleDotColor = (roleName: string) => {
    const r = roles.find((role) => role.name === roleName);
    return r ? r.dotColor : "bg-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-card border border-border rounded-xl p-8 z-10 relative shadow-2xl">
        {/* Logo and Wordmark */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-lg mb-3">
            <CircleDollarSign className="w-6 h-6 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-foreground">SalesOps</h2>
          <p className="text-xs text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {/* Custom Role Selector Dropdown */}
        <div className="mb-5 relative">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Select Profile Role
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-left flex items-center justify-between text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer"
          >
            {selectedRole ? (
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getRoleDotColor(selectedRole)}`} />
                <span className="font-medium">{selectedRole}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Choose a profile role to prefill...</span>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute w-full mt-2 bg-popover border border-border rounded-lg shadow-2xl p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {roles.map((role) => (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent flex items-center gap-2.5 transition-all duration-150 cursor-pointer"
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
          <div className="h-px bg-border/60 flex-1" />
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Or enter email</span>
          <div className="h-px bg-border/60 flex-1" />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="name@salesops.com"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <a
                href="#forgot"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
                <Lock className="w-4 h-4 text-muted-foreground" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSelectedRole(null);
                }}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
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
              className="h-4 w-4 rounded bg-background border-border text-primary focus:ring-offset-0 focus:ring-primary/20 accent-primary"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-muted-foreground cursor-pointer select-none">
              Remember me on this device
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Space for Error Messages */}
        <div className={`transition-all duration-300 ${errorMessage ? "opacity-100 h-10 mt-5" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive truncate">{errorMessage}</span>
          </div>
        </div>
      </div>

      {/* Role Pill Tags Footer (Linked to select for fallback/quick accessibility) */}
      <div className="mt-8 z-10 w-full max-w-[440px] text-center">
        <div className="w-full flex items-center justify-between gap-3 mb-3">
          <div className="h-px bg-border/60 flex-1" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2">
            Quick Roles Login
          </span>
          <div className="h-px bg-border/60 flex-1" />
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
                    ? "ring-2 ring-primary/20 border-primary opacity-100 scale-105"
                    : "opacity-75 hover:opacity-100"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${role.dotColor}`} />
                <span className="text-foreground">{role.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
