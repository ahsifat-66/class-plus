"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SignUpPage() {
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess(`Account created! Welcome, ${data.user.name}! Redirecting...`);

      if (data.user) {
        try {
          localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
        } catch (e) {}
      }

      const targetDestination = data.redirectTo || (role === "TEACHER" ? "/dashboard?view=teaching" : "/dashboard?view=enrolled");
      setTimeout(() => {
        window.location.href = targetDestination;
      }, 400);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Class<span className="text-indigo-600">Pulse</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline">Already have an account?</span>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 font-bold text-indigo-600 hover:bg-slate-50 shadow-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Account Creation</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Your ClassPulse Account
            </h1>
            <p className="text-xs text-slate-500">
              Choose your primary role to get started (you can both teach & enroll in any class)
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selector Radio Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Your Primary Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Student Option */}
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center ${
                      role === "STUDENT"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl mb-1.5 ${
                        role === "STUDENT"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold">I am a Student</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Learn & Submit</span>
                  </button>

                  {/* Teacher Option */}
                  <button
                    type="button"
                    onClick={() => setRole("TEACHER")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center ${
                      role === "TEACHER"
                        ? "border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-600"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl mb-1.5 ${
                        role === "TEACHER"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold">I am a Teacher</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Create & Guide</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder={role === "TEACHER" ? "e.g. Dr. Jane Smith" : "e.g. Alex Morgan"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-98 disabled:opacity-50 ${
                    role === "TEACHER"
                      ? "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  }`}
                >
                  <span>{isSubmitting ? "Creating Account..." : `Sign Up as ${role === "TEACHER" ? "Teacher" : "Student"}`}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="text-center text-xs text-slate-500 space-y-1">
            <div>
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
                Sign In
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              By signing up, you gain instant access to your classes, discussions, and AI tools.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        ClassPulse • Modern Learning Platform
      </footer>
    </div>
  );
}
