"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ChevronDown, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RoleConfig {
  name: string;
  email: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Signup Form States
  const [nameSignup, setNameSignup] = useState("");
  const [emailSignup, setEmailSignup] = useState("");
  const [passwordSignup, setPasswordSignup] = useState("");
  const [confirmPasswordSignup, setConfirmPasswordSignup] = useState("");
  const [selectedRoleSignup, setSelectedRoleSignup] = useState<string | null>(null);
  const [isDropdownOpenSignup, setIsDropdownOpenSignup] = useState(false);

  // Alert/Status States
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roles: RoleConfig[] = [
    {
      name: "Fleet Manager",
      email: "manager@transitops.com",
      dotColor: "bg-chart-1",
      borderColor: "border-chart-1/20",
      bgColor: "bg-chart-1/10",
    },
    {
      name: "Dispatcher",
      email: "dispatcher@transitops.com",
      dotColor: "bg-chart-2",
      borderColor: "border-chart-2/20",
      bgColor: "bg-chart-2/10",
    },
    {
      name: "Safety Officer",
      email: "safety@transitops.com",
      dotColor: "bg-chart-3",
      borderColor: "border-chart-3/20",
      bgColor: "bg-chart-3/10",
    },
    {
      name: "Financial Analyst",
      email: "finance@transitops.com",
      dotColor: "bg-chart-4",
      borderColor: "border-chart-4/20",
      bgColor: "bg-chart-4/10",
    },
  ];

  // Parse mode query param on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup") {
        setActiveTab("signup");
      }
    }
  }, []);

  const handleRoleSelect = (role: RoleConfig) => {
    setEmail(role.email);
    setPassword("password123");
    setSelectedRole(role.name);
    setErrorMessage("");
    setIsDropdownOpen(false);
  };

  const handleRoleSelectSignup = (roleName: string) => {
    setSelectedRoleSignup(roleName);
    setErrorMessage("");
    setIsDropdownOpenSignup(false);
  };

  const saveUserLocally = () => {
    try {
      const registeredUsersJSON = localStorage.getItem("transitops_registered_users");
      const registeredUsers = registeredUsersJSON ? JSON.parse(registeredUsersJSON) : [];
      
      const exists = registeredUsers.some((u: any) => u.email.toLowerCase() === emailSignup.toLowerCase());
      if (!exists) {
        registeredUsers.push({
          name: nameSignup,
          email: emailSignup.toLowerCase(),
          password: passwordSignup,
          role: selectedRoleSignup
        });
        localStorage.setItem("transitops_registered_users", JSON.stringify(registeredUsers));
      }
    } catch (e) {
      console.error("Error saving user to localStorage", e);
    }
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password fields.");
      return;
    }

    setIsLoading(true);

    // Simulate login verification
    setTimeout(() => {
      // Find if email matches any role
      const matchedRole = roles.find((r) => r.email.toLowerCase() === email.toLowerCase());
      
      // Check localStorage registered users
      let matchedRegisteredUser = null;
      try {
        const registeredUsersJSON = localStorage.getItem("transitops_registered_users");
        const registeredUsers = registeredUsersJSON ? JSON.parse(registeredUsersJSON) : [];
        matchedRegisteredUser = registeredUsers.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
      } catch (err) {
        console.error("Error checking registered users:", err);
      }

      if (matchedRole) {
        localStorage.setItem("transitops_logged_in", "true");
        localStorage.setItem("transitops_role", matchedRole.name);
        router.push("/dashboard");
      } else if (matchedRegisteredUser) {
        localStorage.setItem("transitops_logged_in", "true");
        localStorage.setItem("transitops_role", matchedRegisteredUser.role || "Fleet Manager");
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!nameSignup.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!emailSignup.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!selectedRoleSignup) {
      setErrorMessage("Please select a profile role.");
      return;
    }
    if (!passwordSignup) {
      setErrorMessage("Please enter a password.");
      return;
    }
    if (passwordSignup !== confirmPasswordSignup) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (passwordSignup.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // Attempt Supabase sign up
      const { error } = await supabase.auth.signUp({
        email: emailSignup,
        password: passwordSignup,
        options: {
          data: {
            full_name: nameSignup,
            role: selectedRoleSignup,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Registration successful! Check your email for confirmation.");
      saveUserLocally();
      
      // Auto-prefill sign-in values and transition tabs
      setTimeout(() => {
        setSuccessMessage("");
        setEmail(emailSignup);
        setPassword("");
        setActiveTab("login");
        setIsLoading(false);
      }, 1500);
    } catch (err: any) {
      console.warn("Supabase signup failed or not configured, using localStorage fallback:", err.message);
      
      // Fallback registration for presentation / demo environment
      saveUserLocally();
      
      setSuccessMessage("Account created successfully! Prefilling login details...");
      setTimeout(() => {
        setSuccessMessage("");
        setEmail(emailSignup);
        setPassword("");
        setActiveTab("login");
        setIsLoading(false);
      }, 1500);
    }
  };

  const getRoleDotColor = (roleName: string) => {
    const r = roles.find((role) => role.name === roleName);
    return r ? r.dotColor : "bg-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Dynamic Background Glowing Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-success/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-[440px] bg-card border border-border rounded-xl p-8 z-10 relative shadow-2xl">
        {/* Logo and Wordmark */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-md mb-3">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-foreground">TransitOps</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "login" ? "Sign in to your account" : "Create your new account"}
          </p>
        </div>

        {/* Sliding Segment Control Switch */}
        <div className="flex bg-background p-1 rounded-lg mb-6 border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form rendering */}
        {activeTab === "login" ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Custom Role Selector Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Select Profile Role
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-left flex items-center justify-between text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer relative"
              >
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-muted-foreground" />
                </span>

                {selectedRole ? (
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getRoleDotColor(selectedRole)}`} />
                    <span className="font-medium">{selectedRole}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Choose a profile role to prefill...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
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

            {/* Email */}
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
                  placeholder="name@transitops.com"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
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

            {/* Submit Sign In */}
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

            {/* Link to Signup */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </form>
        ) : (
          /* ================= SIGNUP FORM ================= */
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-muted-foreground" />
                </span>
                <input
                  type="text"
                  value={nameSignup}
                  onChange={(e) => setNameSignup(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </span>
                <input
                  type="email"
                  value={emailSignup}
                  onChange={(e) => setEmailSignup(e.target.value)}
                  placeholder="name@transitops.com"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Profile Role Selector */}
            <div className="relative">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Select Profile Role
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpenSignup(!isDropdownOpenSignup)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-left flex items-center justify-between text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200 cursor-pointer relative"
              >
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-muted-foreground" />
                </span>

                {selectedRoleSignup ? (
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getRoleDotColor(selectedRoleSignup)}`} />
                    <span className="font-medium">{selectedRoleSignup}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Choose a role...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {isDropdownOpenSignup && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsDropdownOpenSignup(false)} />
                  <div className="absolute w-full mt-2 bg-popover border border-border rounded-lg shadow-2xl p-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    {roles.map((role) => (
                      <button
                        key={role.name}
                        type="button"
                        onClick={() => handleRoleSelectSignup(role.name)}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </span>
                <input
                  type="password"
                  value={passwordSignup}
                  onChange={(e) => setPasswordSignup(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </span>
                <input
                  type="password"
                  value={confirmPasswordSignup}
                  onChange={(e) => setConfirmPasswordSignup(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Sign Up */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Link to Login */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* Error Alert Box */}
        <div className={`transition-all duration-300 ${errorMessage ? "opacity-100 mt-5" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-3 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive">{errorMessage}</span>
          </div>
        </div>

        {/* Success Alert Box */}
        <div className={`transition-all duration-300 ${successMessage ? "opacity-100 mt-5" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-3 rounded bg-accent/10 border border-accent/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent">{successMessage}</span>
          </div>
        </div>
      </div>


    </div>
  );
}
