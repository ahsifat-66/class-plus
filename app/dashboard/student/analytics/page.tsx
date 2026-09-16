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

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
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
      </main>
    </div>
  );
}
