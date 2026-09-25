"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const queryError = searchParams.get("error");

  const { refreshUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [error, setError] = useState(queryError || "");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (queryError) {
      setError(queryError);
    }
  }, [queryError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");
      setUnverifiedEmail("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireVerification) {
          setUnverifiedEmail(email.trim().toLowerCase());
        }
        throw new Error(data.error || "Failed to sign in");
      }

      setSuccess(`Signed in as ${data.user.role}! Redirecting...`);
      if (data.user) {
        try {
          localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
        } catch (e) {}
      }
      await refreshUser();

      const targetDestination = callbackUrl || data.redirectTo;
      setTimeout(() => {
        window.location.href = targetDestination;
      }, 300);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-5 sm:space-y-6">
      <div className="text-center space-y-1.5 px-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Role-Based Secure Sign-In</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Your Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          You will be automatically redirected to your assigned role dashboard
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {unverifiedEmail && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm text-amber-800 space-y-1.5 animate-in fade-in">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Verification Code Required
          </p>
          <p className="text-amber-700">
            Your account is awaiting 6-digit email confirmation.
          </p>
          <div>
            <Link
              href={`/signup?email=${encodeURIComponent(unverifiedEmail)}&step=verify`}
              className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 underline"
            >
              Verify Email Address Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-center text-xs sm:text-sm text-emerald-700 font-bold animate-in fade-in">
          {success}
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-11 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 pl-2 flex items-center text-slate-400 hover:text-slate-600 min-h-[44px]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 sm:py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.99] disabled:opacity-50 min-h-[46px]"
            >
              <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <div className="text-center text-xs sm:text-sm text-slate-500 pb-2">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-800">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
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
            <span className="text-slate-500 hidden sm:inline">Don&apos;t have an account?</span>
            <Link
              href="/signup"
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 my-2 sm:my-6">
        <Suspense fallback={<div className="text-xs text-slate-400">Loading sign in...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        ClassPulse • Strict Role-Based Authentication
      </footer>
    </div>
  );
}
