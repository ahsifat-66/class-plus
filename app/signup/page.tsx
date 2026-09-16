"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  KeyRound,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

function SignUpContent() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email");
  const queryStep = searchParams.get("step");

  const [step, setStep] = useState<"FORM" | "VERIFY">(queryStep === "verify" ? "VERIFY" : "FORM");
  const [role, setRole] = useState<"TEACHER" | "STUDENT">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(queryEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    queryStep === "verify" && queryEmail
      ? `Please enter the 6-digit code sent to ${queryEmail}.`
      : ""
  );

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (queryEmail && !email) {
      setEmail(queryEmail);
    }
    if (queryStep === "verify") {
      setStep("VERIFY");
    }
  }, [queryEmail, queryStep]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit Registration Form
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

      // If verification is required (default production flow)
      if (data.requireVerification) {
        setStep("VERIFY");
        setResendCooldown(30);
        setSuccess(`Verification code sent to ${email.trim().toLowerCase()}!`);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setSuccess(`Account created! Welcome, ${data.user.name}!`);
        if (data.user) {
          try {
            localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
          } catch (e) {}
        }
        const targetDestination =
          data.redirectTo ||
          (role === "TEACHER" ? "/dashboard?view=teaching" : "/dashboard?view=enrolled");
        setTimeout(() => {
          window.location.href = targetDestination;
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted) {
        const nextOtp = [...otp];
        for (let i = 0; i < pasted.length; i++) {
          nextOtp[i] = pasted[i];
        }
        setOtp(nextOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    // Auto-advance to next box if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setSuccess("Account activated successfully! Redirecting to your dashboard...");
      if (data.user) {
        try {
          localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
        } catch (e) {}
      }

      const targetDestination =
        data.redirectTo ||
        (data.user?.role === "TEACHER" ? "/dashboard?view=teaching" : "/dashboard?view=enrolled");

      setTimeout(() => {
        window.location.href = targetDestination;
      }, 500);
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 2: Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setError("");
    setSuccess("");

    try {
      setIsResending(true);
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: "SIGNUP",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setResendCooldown(30);
      setSuccess(`A fresh verification code was sent to ${email}!`);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
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

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">Already registered?</span>
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/60 p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* STEP 1: Registration Form */}
          {step === "FORM" ? (
            <>
              {/* Form Title */}
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Get Started in Seconds</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Create your account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Join ClassPulse as an educator or independent learner
                </p>
              </div>

              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole("STUDENT")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    role === "STUDENT"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("TEACHER")}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    role === "TEACHER"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Teacher</span>
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marie Curie"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. marie@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    We will send a 6-digit verification code to this address.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue & Verify Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* STEP 2: Email OTP Verification Screen */
            <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Verify Your Email
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                  We have sent a 6-digit verification code to:
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{email}</span>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* 6-Digit OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center text-xl sm:text-2xl font-black text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otp.join("").length !== 6}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isVerifyingOtp ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Activate & Enter ClassPulse</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer controls: Resend and Change Email */}
              <div className="flex flex-col items-center gap-2.5 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Didn't receive the email?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-slate-400">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      disabled={isResending}
                      onClick={handleResendOtp}
                      className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline disabled:opacity-50"
                    >
                      {isResending ? "Sending..." : "Resend Code"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("FORM");
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit registration details</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white/50 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} ClassPulse Educational Platform. All rights reserved.
      </footer>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading sign up...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
