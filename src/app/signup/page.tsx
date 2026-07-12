"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleDollarSign, ChevronDown, Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RoleConfig {
  name: string;
  dotColor: string;
  borderColor: string;
  bgColor: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const roles: RoleConfig[] = [
    {
      name: "Sales Manager",
      dotColor: "bg-chart-1",
      borderColor: "border-chart-1/20",
      bgColor: "bg-chart-1/10",
    },
    {
      name: "Account Executive",
      dotColor: "bg-chart-2",
      borderColor: "border-chart-2/20",
      bgColor: "bg-chart-2/10",
    },
    {
      name: "SDR",
      dotColor: "bg-chart-3",
      borderColor: "border-chart-3/20",
      bgColor: "bg-chart-3/10",
    },
    {
      name: "Financial Analyst",
      dotColor: "bg-chart-4",
      borderColor: "border-chart-4/20",
      bgColor: "bg-chart-4/10",
    },
  ];

  // If already logged in, redirect to dashboard
  /* useEffect(() => {
    const isLoggedIn = localStorage.getItem("transitops_logged_in");
    if (isLoggedIn === "true") {
      router.push("/dashboard");
    }
  }, [router]); */

  const handleRoleSelect = (roleName: string) => {
    setSelectedRole(roleName);
    setErrorMessage("");
    setIsDropdownOpen(false);
  };

  const getRoleDotColor = (roleName: string) => {
    const r = roles.find((role) => role.name === roleName);
    return r ? r.dotColor : "bg-muted-foreground";
  };

  const saveUserLocally = () => {
    try {
      const registeredUsersJSON = localStorage.getItem("transitops_registered_users");
      const registeredUsers = registeredUsersJSON ? JSON.parse(registeredUsersJSON) : [];
      
      const exists = registeredUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        registeredUsers.push({
          name,
          email: email.toLowerCase(),
          password,
          role: selectedRole
        });
        localStorage.setItem("transitops_registered_users", JSON.stringify(registeredUsers));
      }
    } catch (e) {
      console.error("Error saving user to localStorage", e);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!selectedRole) {
      setErrorMessage("Please select a profile role.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter a password.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // Attempt Supabase sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: selectedRole,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Registration successful! Check your email for confirmation.");
      saveUserLocally();
      
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      console.warn("Supabase signup failed or not configured, using localStorage fallback:", err.message);
      
      // Fallback registration for presentation / demo environment
      saveUserLocally();
      
      setSuccessMessage("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Main Signup Card */}
      <div className="w-full max-w-[440px] bg-card border border-border rounded-xl p-8 z-10 relative shadow-2xl">
        {/* Logo and Wordmark */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center shadow-lg mb-3">
            <CircleDollarSign className="w-6 h-6 text-accent-foreground" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-foreground">SalesOps</h2>
          <p className="text-xs text-muted-foreground mt-1">Create your new account</p>
        </div>

        {/* Signup Form */}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@salesops.com"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Custom Role Selector Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
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
                <span className="text-muted-foreground">Choose a role...</span>
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
                      onClick={() => handleRoleSelect(role.name)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Sign Up Button */}
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
        </form>

        {/* Error Message Box */}
        <div className={`transition-all duration-300 ${errorMessage ? "opacity-100 h-10 mt-4" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive truncate">{errorMessage}</span>
          </div>
        </div>

        {/* Success Message Box */}
        <div className={`transition-all duration-300 ${successMessage ? "opacity-100 h-10 mt-4" : "opacity-0 h-0 overflow-hidden"}`}>
          <div className="p-2.5 rounded bg-accent/10 border border-accent/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs font-medium text-accent truncate">{successMessage}</span>
          </div>
        </div>

        {/* Link back to Login */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
