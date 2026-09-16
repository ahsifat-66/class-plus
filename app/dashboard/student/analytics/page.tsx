"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  RefreshCw,
  Flame,
  Target,
  Plus,
  Circle,
  X,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface StudentAnalyticsData {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    avatarUrl?: string | null;
    institution?: string | null;
    grade?: string | null;
  };
  metrics: {
    enrolledClassesCount: number;
    totalAssignments: number;
    completedCount: number;
    pendingCount: number;
    overdueCount: number;
    completionRate: number;
    averageScore: number | null;
    totalFocusMinutes?: number;
    totalFocusHours?: number;
    thisWeekFocusMinutes?: number;
    thisWeekFocusHours?: number;
    thisMonthFocusMinutes?: number;
    thisMonthFocusHours?: number;
    studyStreak?: number;
    notesCount?: number;
    totalGoals?: number;
    completedGoals?: number;
    goalsProgressRate?: number;
  };
  completionDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  performanceTrend: Array<{
    assignment: string;
    date: string;
    score: number;
    earned: number;
    max: number;
    classroom: string;
  }>;
  weeklyActivity: Array<{
    week: string;
    count: number;
    dateRange: string;
  }>;
  subjectBreakdown?: Array<{
    name: string;
    subject: string;
    minutes: number;
    hours: number;
    value: number;
    color: string;
  }>;
  personalGoals?: Array<{
    id: string;
    title: string;
    targetDate: string;
    isCompleted: boolean;
  }>;
  recentStudyLogs?: Array<{
    id: string;
    subject: string;
    durationMinutes: number;
    date: string;
    notes: string | null;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    dueDate: string;
    maxPoints: number;
    classroomName: string;
    status: "completed" | "pending" | "overdue";
    isSubmitted: boolean;
    submission: {
      id: string;
      grade: number | null;
      feedback: string | null;
      submittedAt: string;
    } | null;
  }>;
}

export default function StudentAnalyticsPage() {
  const [data, setData] = useState<StudentAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Log Session Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    subject: "General",
    durationMinutes: 30,
    notes: "",
  });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/student", { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to load student analytics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Failed to load student analytics:", err);
      setError(err.message || "Failed to load analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingLog(true);
      const res = await fetch("/api/student/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logForm),
      });
      if (res.ok) {
        setIsLogModalOpen(false);
        setLogForm({ subject: "General", durationMinutes: 30, notes: "" });
        await fetchAnalytics();
      }
    } catch (e) {
      console.error("Failed to log session", e);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleToggleGoal = async (goalId: string, currentStatus: boolean) => {
    try {
      if (data) {
        setData({
          ...data,
          personalGoals: data.personalGoals?.map((g) =>
            g.id === goalId ? { ...g, isCompleted: !currentStatus } : g
          ),
        });
      }
      await fetch(`/api/student/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
      await fetchAnalytics();
    } catch (e) {
      console.error("Failed to toggle goal", e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard?view=enrolled"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Dashboard</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/student/locker"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-xs hover:bg-emerald-100 transition-all active:scale-95"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Academic Locker</span>
            </Link>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Study Session</span>
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md border border-emerald-400/20">
                <GraduationCap className="h-3.5 w-3.5 text-emerald-300" />
                <span>Student Personal Performance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {data?.student.name ? `${data.student.name}'s Analytics` : "Academic Analytics"}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl">
                Real-time tracking of assignment completion rates, score progression curves, and submission activity.
              </p>
            </div>

            {data?.metrics && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shrink-0">
                <Award className="h-8 w-8 text-emerald-300 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider block">
                    Completion Status
                  </span>
                  <span className="text-2xl font-black text-white">
                    {data.metrics.completionRate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-xs sm:text-sm text-rose-700 shadow-sm animate-in fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !data ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-10 w-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500">Loading your academic analytics...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Enrolled Courses
                  </span>
                  <BookOpen className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data.metrics.enrolledClassesCount}
                </div>
                <span className="text-[11px] text-slate-500">Active classrooms</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Completed
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {data.metrics.completedCount}
                  <span className="text-xs font-bold text-slate-400 ml-1.5">
                    / {data.metrics.totalAssignments}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">Deliverables submitted</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Average Score
                  </span>
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {data.metrics.averageScore !== null ? `${data.metrics.averageScore}%` : "—"}
                </div>
                <span className="text-[11px] text-slate-500">Across graded work</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pending / Overdue
                  </span>
                  {data.metrics.overdueCount > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data.metrics.pendingCount}{" "}
                  {data.metrics.overdueCount > 0 && (
                    <span className="text-xs font-bold text-rose-600 ml-1">
                      ({data.metrics.overdueCount} overdue)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">Action items remaining</span>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Assignment Completion Donut Chart */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Assignment Completion
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {data.metrics.completionRate}% Done
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Completed vs Pending vs Overdue deliverables
                  </p>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  {data.metrics.totalAssignments === 0 ? (
                    <div className="text-xs text-slate-400 text-center">
                      No assignments assigned yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.completionDistribution}
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {data.completionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `${value} assignment(s)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Performance Trend Line Chart */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4 lg:col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Performance Trend
                    </h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Score Over Time
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Grades earned across chronological assignment submissions
                  </p>
                </div>

                <div className="h-64 w-full">
                  {data.performanceTrend.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No graded assignment submissions yet. Submit deliverables to see your score trajectory.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={data.performanceTrend}
                        margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          domain={[0, 100]}
                          tickLine={false}
                          unit="%"
                        />
                        <Tooltip
                          formatter={(val: any, name: any, item: any) => [
                            `${val}% (${item.payload.earned}/${item.payload.max} pts)`,
                            item.payload.assignment,
                          ]}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ fill: "#6366f1", r: 5, strokeWidth: 2, stroke: "#ffffff" }}
                          activeDot={{ r: 7, fill: "#4f46e5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Chart 3: Weekly Activity Bar Chart */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Weekly Activity
                  </h2>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    Last 6 Weeks
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Total deliverables submitted per calendar week
                </p>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.weeklyActivity}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="week"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      allowDecimals={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} submissions`,
                        item.payload.dateRange,
                      ]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#0d9488"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SECTION: Self-Study & Personal Focus Analytics */}
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Self-Study & Personal Focus Analytics
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Independent tracking from your Pomodoro sessions, Academic Locker, and personal milestones
                  </p>
                </div>

                <Link
                  href="/dashboard/student/locker"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Open Academic Locker & Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Self-Study Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Focus This Week
                    </span>
                    <Clock className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                    {data.metrics.thisWeekFocusHours || 0}
                    <span className="text-xs font-bold text-slate-400 ml-1">hrs</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {data.metrics.totalFocusHours || 0} hrs all-time focus
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Study Streak
                    </span>
                    <Flame className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 flex items-center gap-1.5">
                    <span>{data.metrics.studyStreak || 0}</span>
                    <span className="text-xs font-bold text-slate-400">Days</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Consecutive active study days</span>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Milestones
                    </span>
                    <Target className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                    {data.metrics.completedGoals || 0}
                    <span className="text-xs font-bold text-slate-400 ml-1">
                      / {data.metrics.totalGoals || 0}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {data.metrics.goalsProgressRate || 0}% goals accomplished
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Locker Notes
                    </span>
                    <BookOpen className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">
                    {data.metrics.notesCount || 0}
                  </div>
                  <span className="text-[11px] text-slate-500">Personal study guides & notes</span>
                </div>
              </div>

              {/* Subject Breakdown Chart & Personal Goals Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Focus Breakdown Donut Chart */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Subject Study Time Breakdown
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hours spent per subject across all logged focus sessions
                      </p>
                    </div>
                    <button
                      onClick={() => setIsLogModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 p-1 rounded-lg hover:bg-slate-100"
                      title="Log a new session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Time</span>
                    </button>
                  </div>

                  <div className="h-64 w-full">
                    {!data.subjectBreakdown || data.subjectBreakdown.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                        <Clock className="w-8 h-8 text-slate-300" />
                        <p>No self-study sessions logged yet.</p>
                        <button
                          onClick={() => setIsLogModalOpen(true)}
                          className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200"
                        >
                          Log First Session
                        </button>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.subjectBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                          >
                            {data.subjectBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(val: any, name: any, item: any) => [
                              `${val} hrs (${item.payload.minutes} mins)`,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                              fontSize: "12px",
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Personal Goals Checklist */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          Personal Goals & Milestones
                        </h3>
                        <p className="text-xs text-slate-500">
                          Self-directed study targets
                        </p>
                      </div>
                      <Link
                        href="/dashboard/student/locker"
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Manage in Locker →
                      </Link>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.metrics.goalsProgressRate || 0}%` }}
                      />
                    </div>

                    {/* Goal items */}
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {!data.personalGoals || data.personalGoals.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          No goals created yet. Set goals in the Academic Locker to keep track of your targets!
                        </div>
                      ) : (
                        data.personalGoals.map((g) => (
                          <div
                            key={g.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                              g.isCompleted
                                ? "bg-slate-50 border-slate-200 text-slate-400"
                                : "bg-white border-slate-200 text-slate-800 hover:border-indigo-200"
                            }`}
                          >
                            <button
                              onClick={() => handleToggleGoal(g.id, g.isCompleted)}
                              className="flex items-center gap-2 text-left flex-1"
                            >
                              {g.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 hover:text-indigo-600 shrink-0" />
                              )}
                              <span className={g.isCompleted ? "line-through text-slate-400" : "font-medium"}>
                                {g.title}
                              </span>
                            </button>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {new Date(g.targetDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {data.metrics.completedGoals || 0} of {data.metrics.totalGoals || 0} completed
                    </span>
                    <span className="font-bold text-indigo-600">
                      {data.metrics.goalsProgressRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables Breakdown Table */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Deliverables Breakdown
                </h2>
                <span className="text-xs text-slate-400">
                  {data.deliverables.length} total tasks
                </span>
              </div>

              {data.deliverables.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No deliverables found for your enrolled classes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">Assignment</th>
                        <th className="pb-3 font-semibold">Classroom</th>
                        <th className="pb-3 font-semibold">Due Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.deliverables.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-bold text-slate-900 pr-3">
                            {d.title}
                          </td>
                          <td className="py-3 text-slate-600 pr-3">
                            {d.classroomName}
                          </td>
                          <td className="py-3 text-slate-500 pr-3">
                            {new Date(d.dueDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3 pr-3">
                            {d.status === "completed" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Completed</span>
                              </span>
                            ) : d.status === "overdue" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[10px] font-bold">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Overdue</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-bold">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            {d.submission?.grade !== null && d.submission?.grade !== undefined ? (
                              <span className="text-emerald-600 font-extrabold">
                                {d.submission.grade} / {d.maxPoints} pts
                              </span>
                            ) : d.isSubmitted ? (
                              <span className="text-blue-600 text-[11px]">Turned in</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Quick Log Session Modal */}
        {isLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Log Study Session</h3>
                </div>
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuickLog} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <select
                    value={logForm.subject}
                    onChange={(e) => setLogForm({ ...logForm, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    required
                    value={logForm.durationMinutes}
                    onChange={(e) =>
                      setLogForm({ ...logForm, durationMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    {[15, 25, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setLogForm({ ...logForm, durationMinutes: mins })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          logForm.durationMinutes === mins
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Session Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What did you focus on or accomplish?"
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLog}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSubmittingLog ? "Saving..." : "Log Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
