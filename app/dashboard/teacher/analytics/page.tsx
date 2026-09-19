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
  Plus,
  LogIn,
  X,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useUser } from "@/context/UserContext";

interface TeacherAnalyticsData {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
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
  const { currentUser } = useUser();
  const [data, setData] = useState<TeacherAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");

  // In-page Student Drill-down inspection modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any | null>(null);
  const [isLoadingDrillDown, setIsLoadingDrillDown] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/teacher", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || json.error) {
        if (res.status === 401) {
          setError("Unauthorized: Please sign in to view your teacher analytics.");
        } else if (res.status === 403) {
          setError(json.error || "Access restricted: Teacher analytics is for faculty only.");
        } else {
          setError(json.error || "Failed to load teacher analytics.");
        }
        setData(null);
        return;
      }

      setData(json);
    } catch (err: any) {
      console.error("Failed to load teacher analytics:", err);
      setError(err.message || "Failed to load teacher analytics.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleOpenStudentDrillDown = async (studentId: string) => {
    setSelectedStudentId(studentId);
    try {
      setIsLoadingDrillDown(true);
      const res = await fetch(`/api/analytics/student/${studentId}`);
      if (res.ok) {
        const d = await res.json();
        setDrillDownData(d);
      }
    } catch (e) {
      console.error("Failed to load student drill down", e);
    } finally {
      setIsLoadingDrillDown(false);
    }
  };

  const handleCloseDrillDown = () => {
    setSelectedStudentId(null);
    setDrillDownData(null);
  };

  const filteredStudents = (data?.students || []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      selectedCourseFilter === "all" ||
      (s.classrooms || []).some((c) => c.id === selectedCourseFilter);
    return matchesSearch && matchesCourse;
  });

  const getInitials = (name?: string) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isUnauthorized = error && error.toLowerCase().includes("unauthorized");
  const isStudentError = error && error.toLowerCase().includes("student");

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
                    {data.metrics.totalCourses ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification Card */}
        {error && (
          <div className="rounded-3xl bg-white border border-rose-200 p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isUnauthorized ? "Sign In Required" : "Analytics Notice"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">{error}</p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {isUnauthorized && (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              )}
              {isStudentError && (
                <Link
                  href="/dashboard/student/analytics"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition-all"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Open Student Analytics</span>
                </Link>
              )}
              <button
                onClick={fetchAnalytics}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !data && !error ? (
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
                  {data.metrics?.totalActiveStudents ?? 0}
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
                  {data.metrics?.assignmentsPosted ?? 0}
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
                  {data.metrics?.submissionsPendingGrading ?? 0}
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
                  {data.metrics?.totalSubmissions ?? 0}
                </div>
                <span className="text-[11px] text-slate-500">Received from students</span>
              </div>
            </div>

            {/* Zero Classrooms Banner if teacher hasn't created classes yet */}
            {(data.classes || []).length === 0 && (
              <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/50 p-8 sm:p-10 text-center space-y-4 shadow-sm">
                <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-900">No Classrooms Created Yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    You have not created any classrooms yet. Once you create a class and enroll students, your real-time performance analytics, turn-in rates, and grade distribution charts will automatically update here.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/dashboard?view=teaching"
                    className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Classroom</span>
                  </Link>
                </div>
              </div>
            )}

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
                      data={data.gradeDistribution || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="range" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} student submission(s)`,
                          item?.payload?.range || "",
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
                        {(data.gradeDistribution || []).map((entry, index) => (
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
                  {(!data.turnInRates || data.turnInRates.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <span>No assignments posted yet. Coursework turn-in rates will appear here.</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(data.turnInRates || []).slice(0, 8)}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="title"
                          stroke="#94a3b8"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(t) => (t && t.length > 10 ? `${t.slice(0, 8)}…` : t || "")}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                        <Tooltip
                          formatter={(val: any, name: any) => [
                            `${val} student(s)`,
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

                  {(data.classes || []).length > 1 && (
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
                <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                  <Users className="h-6 w-6 mx-auto text-slate-300" />
                  <p>No student enrollment records found.</p>
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
                        <th className="pb-3 font-semibold text-right">Inspect</th>
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
                              {(s.classrooms || []).map((c) => (
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
                            <button
                              onClick={() => handleOpenStudentDrillDown(s.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
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

      {/* Drill-Down Student Analytics Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Student Performance Profile
                  </h2>
                  <p className="text-xs text-slate-500">
                    Detailed task completion, deliverables, and assignment scores
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDrillDown}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDrillDown ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-3">
                <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <span>Loading student analytics...</span>
              </div>
            ) : drillDownData ? (
              <div className="space-y-6">
                {/* Student Bio */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  {(drillDownData.student?.avatarUrl || drillDownData.student?.avatar) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={drillDownData.student?.avatarUrl || drillDownData.student?.avatar}
                      alt={drillDownData.student?.name}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-500/20"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {getInitials(drillDownData.student?.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {drillDownData.student?.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {drillDownData.student?.email}
                    </p>
                  </div>
                  {(drillDownData.metrics?.averageGrade !== null && drillDownData.metrics?.averageGrade !== undefined) ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Average Grade
                      </span>
                      <span className="text-xl font-black text-purple-700">
                        {drillDownData.metrics?.averageGrade}%
                      </span>
                    </div>
                  ) : (drillDownData.metrics?.overallGradeAvg !== null && drillDownData.metrics?.overallGradeAvg !== undefined) ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Average Grade
                      </span>
                      <span className="text-xl font-black text-purple-700">
                        {drillDownData.metrics?.overallGradeAvg}%
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Enrolled Courses
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {drillDownData.metrics?.enrolledCount ?? drillDownData.classrooms?.length ?? 0}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Turn-In Rate
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {drillDownData.metrics?.completionRate ?? 0}%
                    </span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Submissions
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {drillDownData.metrics?.submittedCount ?? 0}/{drillDownData.metrics?.totalAssignments ?? 0}
                    </span>
                  </div>
                </div>

                {/* Deliverables List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Course Deliverables & Tasks
                  </h4>
                  {(() => {
                    const tasks = drillDownData.assignments || drillDownData.deliverables || [];
                    if (tasks.length === 0) {
                      return <p className="text-xs text-slate-400 italic">No deliverables assigned yet.</p>;
                    }
                    return (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {tasks.map((d: any) => {
                          const isSubmitted = d.isSubmitted || !!d.submission;
                          const grade = d.grade !== undefined && d.grade !== null ? d.grade : d.submission?.grade ?? null;
                          return (
                            <div
                              key={d.id}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">{d.title}</span>
                                <span className="text-[11px] text-slate-400">
                                  {d.classroomName} • Max {d.maxPoints} pts
                                </span>
                              </div>
                              <div>
                                {grade !== null ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {grade}/{d.maxPoints} pts
                                  </span>
                                ) : isSubmitted ? (
                                  <span className="text-blue-600 font-semibold">Turned In</span>
                                ) : (
                                  <span className="text-amber-600 font-semibold">Pending</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-500">Failed to load student drill-down profile.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
