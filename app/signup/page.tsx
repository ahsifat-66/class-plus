"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Real-time password requirement checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

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
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters and include 1 uppercase letter and 1 number.");
      return;
    }
    if (role === "TEACHER" && !teacherCode.trim()) {
      setError("A teacher access code is required to register as faculty (use TEACHER2024).");
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
          teacherCode: role === "TEACHER" ? teacherCode.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess(`Account created! Redirecting to your ${role.toLowerCase()} dashboard...`);

      setTimeout(() => {
        router.push(data.redirectTo || (role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student"));
      }, 700);
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
              <span>Role-Based Registration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Your ClassPulse Account
            </h1>
            <p className="text-xs text-slate-500">
              Select whether you are joining as a Student or Teacher
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
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Student Option */}
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center ${
                      role === "STUDENT"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20"
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
                    <span className="text-[10px] text-slate-400 mt-0.5">Learn & Ask</span>
                  </button>

                  {/* Teacher Option */}
                  <button
                    type="button"
                    onClick={() => setRole("TEACHER")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all text-center ${
                      role === "TEACHER"
                        ? "border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20"
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
                    <span className="text-[10px] text-slate-400 mt-0.5">Manage & AI Copilot</span>
                  </button>
                </div>
              </div>

              {/* Conditional Teacher Access Code */}
              {role === "TEACHER" && (
                <div className="rounded-2xl bg-purple-50/80 border border-purple-200 p-3.5 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                    <span>Teacher Access Code Required</span>
                  </div>
                  <p className="text-[11px] text-purple-700">
                    Faculty verification code is required. For demo evaluation, use <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200">TEACHER2024</code>.
                  </p>
                  <input
                    type="text"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    placeholder="Enter teacher passcode (e.g. TEACHER2024)"
                    className="w-full rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
              )}

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
                    placeholder={role === "TEACHER" ? "Prof. Alan Turing" : "Alex Morgan"}
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
                    placeholder={role === "TEACHER" ? "faculty@university.edu" : "student@university.edu"}
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
                    placeholder="Create secure password"
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

                {/* Password Requirements Checklist */}
                <div className="mt-2.5 space-y-1 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Password Security Requirements:
                  </span>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasMinLength ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${hasMinLength ? "text-emerald-600" : "text-slate-300"}`}
                      />
                      At least 8 characters
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasUppercase ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${hasUppercase ? "text-emerald-600" : "text-slate-300"}`}
                      />
                      At least one uppercase letter (A-Z)
                    </span>
                    <span
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${hasNumber ? "text-emerald-600" : "text-slate-300"}`}
                      />
                      At least one number (0-9)
                    </span>
                  </div>
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

          <div className="text-center text-xs text-slate-500">
            By signing up, you agree to ClassPulse's academic collaboration policies.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        ClassPulse • Strict Role-Based Authentication
      </footer>
    </div>
  );
}
