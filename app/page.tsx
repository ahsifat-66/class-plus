"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  Bot,
  MessageSquare,
  Users,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { currentUser, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "TEACHER") {
        router.replace("/dashboard/teacher");
      } else if (currentUser.role === "STUDENT") {
        router.replace("/dashboard/student");
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <span className="h-4 w-4 rounded-full bg-indigo-600 animate-ping" />
          <span>Loading ClassPulse...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white shadow-md shadow-indigo-200">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Class<span className="text-indigo-600">Pulse</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Teacher & Student Collaboration Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Strict Role-Based Authentication & Socratic Guidance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              A Hub Tailored for <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 bg-clip-text text-transparent">
                Teachers & Students
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empowering faculty with Gemini AI Announcement Copilots and assignment grading, while equipping students with a "Due Soon" Action Center and an embedded Socratic AI Tutor.
            </p>
          </div>

          {/* Role Portals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            {/* Teacher Card */}
            <div className="rounded-3xl border-2 border-purple-200 bg-white p-6 sm:p-8 shadow-lg shadow-purple-100/50 hover:border-purple-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Teacher Workspace</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage multiple courses, generate join codes, draft Markdown announcements with automated student FAQs, and review submissions.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
                >
                  <span>Teacher Sign-In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Register as Faculty
                </Link>
              </div>
            </div>

            {/* Student Card */}
            <div className="rounded-3xl border-2 border-emerald-200 bg-white p-6 sm:p-8 shadow-lg shadow-emerald-100/50 hover:border-emerald-400 transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Student Portal</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track upcoming task deadlines across all classes, enroll via class code, participate in real-time discussion channels, and ask the Socratic AI Tutor.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <span>Student Sign-In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Register as Student
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        ClassPulse • Production-Grade Academic Platform
      </footer>
    </div>
  );
}
