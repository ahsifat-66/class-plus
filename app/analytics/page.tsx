"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import StudentAnalyticsView from "@/components/analytics/StudentAnalyticsView";
import TeacherAnalyticsView from "@/components/analytics/TeacherAnalyticsView";
import CreateClassModal from "@/components/CreateClassModal";
import JoinClassModal from "@/components/JoinClassModal";
import {
  BarChart3,
  GraduationCap,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role");

  const { currentUser, userSummary } = useUser();

  const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");
  const [studentData, setStudentData] = useState<any | null>(null);
  const [teacherOverview, setTeacherOverview] = useState<any | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals for navbar
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    if (initialRole === "teacher") {
      setActiveTab("teacher");
    } else if (initialRole === "student") {
      setActiveTab("student");
    } else if (currentUser?.role === "TEACHER" && (userSummary?.teachingCount ?? 0) > 0) {
      setActiveTab("teacher");
    }
  }, [initialRole, currentUser, userSummary]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [meRes, teacherRes] = await Promise.all([
        fetch("/api/analytics/me", { cache: "no-store" }),
        fetch("/api/analytics/teacher", { cache: "no-store" }),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setStudentData(meData.student);
        setTeacherOverview(meData.teacher);
      } else {
        throw new Error("Failed to load personal analytics");
      }

      if (teacherRes.ok) {
        const tData = await teacherRes.json();
        setTeacherClasses(tData.classes || []);
        setTeacherStudents(tData.students || []);
      }
    } catch (err: any) {
      console.error("Analytics fetch error:", err);
      setError("Unable to load analytics data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const canShowTeacherTab =
    currentUser?.role === "TEACHER" || (userSummary?.teachingCount ?? 0) > 0;
  const canShowStudentTab =
    currentUser?.role === "STUDENT" || (userSummary?.enrolledCount ?? 0) > 0 || !canShowTeacherTab;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onCreateClassOpen={() => setIsCreateOpen(true)}
        onJoinClassOpen={() => setIsJoinOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span>Analytics Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Hero Banner with Tab Switcher */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md border border-white/10">
                <BarChart3 className="h-3.5 w-3.5 text-indigo-300" />
                <span>Performance & Progress Analytics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeTab === "student" ? "Your Student Learning Analytics" : "Faculty Teaching & Student Analytics"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {activeTab === "student"
                  ? "Track your completion rates, score trends, and subject performance across all enrolled courses."
                  : "Monitor class performance, submission completion, and drill down into individual student metrics."}
              </p>
            </div>

            {/* Role Tab Switcher (if user has both or teacher) */}
            {canShowTeacherTab && canShowStudentTab && (
              <div className="inline-flex rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/10 self-start md:self-center">
                <button
                  onClick={() => setActiveTab("student")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "student"
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>Student View</span>
                </button>

                <button
                  onClick={() => setActiveTab("teacher")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === "teacher"
                      ? "bg-white text-purple-900 shadow-md"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-purple-600" />
                  <span>Teacher View</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-900 shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Content Loading Skeleton */}
        {isLoading && !studentData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-3xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
            <div className="h-80 rounded-3xl bg-white border border-slate-200 animate-pulse" />
          </div>
        ) : (
          <>
            {/* TAB 1: Student View */}
            {activeTab === "student" && studentData && (
              <StudentAnalyticsView data={studentData} />
            )}

            {/* TAB 2: Teacher View */}
            {activeTab === "teacher" && teacherOverview && (
              <TeacherAnalyticsView
                overviewData={teacherOverview}
                classesList={teacherClasses}
                studentsList={teacherStudents}
              />
            )}
          </>
        )}
      </main>

      {/* Modals for navbar buttons */}
      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={fetchAnalytics}
      />

      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={fetchAnalytics}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading Analytics...</span>
          </div>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
