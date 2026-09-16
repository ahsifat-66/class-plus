"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
  FileText,
  Clock,
  GraduationCap,
  Search,
  BookOpen,
  Award,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface TeacherAnalyticsData {
  classes: Array<{
    id: string;
    name: string;
    subject: string;
    code: string;
    studentCount: number;
    assignmentCount: number;
  }>;
  students: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    avatarUrl?: string | null;
    institution: string | null;
    grade: string | null;
    classrooms: Array<{ id: string; name: string; subject: string }>;
    totalAssignments: number;
    submittedCount: number;
    gradedCount: number;
    completionRate: number;
    averageGrade: number | null;
  }>;
  metrics: {
    totalStudents: number;
    totalActiveStudents: number;
    totalCourses: number;
    totalAssignments: number;
    assignmentsPosted: number;
    totalSubmissions: number;
    submissionsPendingGrading: number;
    gradedSubmissionsCount: number;
  };
  gradeDistribution: Array<{
    range: string;
    count: number;
    color: string;
  }>;
  turnInRates: Array<{
    id: string;
    title: string;
    classroomName: string;
    dueDate: string;
    totalEnrolled: number;
    turnedInCount: number;
    missingCount: number;
    turnInRate: number;
  }>;
}

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<TeacherAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/teacher", { cache: "no-store" });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to load teacher analytics.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Failed to load teacher analytics:", err);
      setError(err.message || "Failed to load analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const filteredStudents = (data?.students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourseFilter === "all" ||
      s.classrooms.some((c) => c.id === selectedCourseFilter);
    return matchesSearch && matchesCourse;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard?view=teaching"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Teaching Dashboard</span>
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
        <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md border border-purple-400/20">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
                <span>Teacher Analytics Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Classroom & Student Oversight
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl">
                Comprehensive overview of student turn-in rates, class performance distributions, and individual student progress.
              </p>
            </div>

            {data?.metrics && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 shrink-0">
                <Award className="h-8 w-8 text-purple-300 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-200 tracking-wider block">
                    Active Courses
                  </span>
                  <span className="text-2xl font-black text-white">
                    {data.metrics.totalCourses}
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
            <div className="h-10 w-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500">Loading classroom oversight analytics...</p>
          </div>
        ) : data ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Active Students
                  </span>
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data.metrics.totalActiveStudents}
                </div>
                <span className="text-[11px] text-slate-500">Enrolled across classes</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Assignments Posted
                  </span>
                  <FileText className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
                  {data.metrics.assignmentsPosted}
                </div>
                <span className="text-[11px] text-slate-500">Active coursework</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Submissions Pending Grading
                  </span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                  {data.metrics.submissionsPendingGrading}
                </div>
                <span className="text-[11px] text-slate-500">Needs teacher review</span>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Submissions
                  </span>
                  <GraduationCap className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {data.metrics.totalSubmissions}
                </div>
                <span className="text-[11px] text-slate-500">Received from students</span>
              </div>
            </div>

            {/* Visual Charts: Performance Distribution & Turn-in Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Class Performance Distribution Bar Chart */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Class Performance Distribution
                    </h2>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      Grade Ranges
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Distribution of student scores across four standardized performance brackets
                  </p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.gradeDistribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} student submission(s)`,
                          item.payload.range,
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Assignment Turn-in Rate Stacked Bar Chart */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      Assignment Turn-in Rate
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Turned In vs Missing
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Stacked comparison of turned-in deliverables vs missing per coursework
                  </p>
                </div>

                <div className="h-64 w-full">
                  {data.turnInRates.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No assignments posted yet. Create assignments to see turn-in rates.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.turnInRates.slice(0, 8)}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="title"
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(t) => (t.length > 10 ? `${t.slice(0, 8)}…` : t)}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                        <Tooltip
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
                          wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                        />
                        <Bar
                          dataKey="turnedInCount"
                          name="Turned In"
                          stackId="a"
                          fill="#10b981"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="missingCount"
                          name="Missing"
                          stackId="a"
                          fill="#ef4444"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Student Drill-Down Table */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    Student Submission Progress
                  </h2>
                  <p className="text-xs text-slate-500">
                    Individual completion progress bars and academic score tracking
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {data.classes.length > 1 && (
                    <select
                      value={selectedCourseFilter}
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="all">All Courses</option>
                      {data.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No students found matching your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 font-semibold">Student</th>
                        <th className="pb-3 font-semibold">Course(s)</th>
                        <th className="pb-3 font-semibold">Submission Progress</th>
                        <th className="pb-3 font-semibold text-center">Avg Grade</th>
                        <th className="pb-3 font-semibold text-right">Drill-down</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2.5">
                              {(s.avatarUrl || s.avatar) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={s.avatarUrl || s.avatar || ""}
                                  alt={s.name}
                                  className="h-8 w-8 rounded-full object-cover ring-2 ring-purple-500/20 shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {getInitials(s.name)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{s.name}</div>
                                <div className="text-[11px] text-slate-400">{s.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 pr-3 text-slate-600">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {s.classrooms.map((c) => (
                                <span
                                  key={c.id}
                                  className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 pr-3 min-w-[180px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-700">
                                  {s.submittedCount} / {s.totalAssignments} tasks
                                </span>
                                <span className="font-bold text-slate-900">
                                  {s.completionRate}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    s.completionRate >= 80
                                      ? "bg-emerald-500"
                                      : s.completionRate >= 50
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                  }`}
                                  style={{ width: `${s.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 pr-3 text-center">
                            {s.averageGrade !== null ? (
                              <span
                                className={`inline-block font-extrabold px-2.5 py-0.5 rounded-full text-xs ${
                                  s.averageGrade >= 90
                                    ? "bg-emerald-50 text-emerald-700"
                                    : s.averageGrade >= 80
                                    ? "bg-blue-50 text-blue-700"
                                    : s.averageGrade >= 70
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {s.averageGrade}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3 text-right">
                            <Link
                              href={`/analytics?studentId=${s.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
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
