"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { formatRelativeDueDate } from "@/lib/utils";

interface StudentAnalyticsViewProps {
  data: {
    enrolledCount: number;
    totalAssignments: number;
    submittedCount: number;
    gradedCount: number;
    pendingSubmissionCount: number;
    pendingGradingCount: number;
    overallGradeAvg: number;
    completionRate: number;
    completionDistribution: Array<{ name: string; value: number; color: string }>;
    scoreHistory: Array<{
      assignment: string;
      date: string;
      scorePercentage: number;
      earned: number;
      max: number;
      subject: string;
    }>;
    courseBreakdown: Array<{
      classroomName: string;
      subject: string;
      assignmentsCount: number;
      submittedCount: number;
      completionRate: number;
      averageScore: number;
    }>;
    recentSubmissions: Array<{
      id: string;
      title: string;
      dueDate: string;
      maxPoints: number;
      classroomName: string;
      subject: string;
      isSubmitted: boolean;
      grade: number | null;
      feedback: string | null;
      submittedAt: string | null;
    }>;
  };
}

export default function StudentAnalyticsView({ data }: StudentAnalyticsViewProps) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");

  const filteredSubmissions =
    selectedCourseFilter === "ALL"
      ? data.recentSubmissions
      : data.recentSubmissions.filter((s) => s.classroomName === selectedCourseFilter);

  const courseNames = Array.from(new Set(data.recentSubmissions.map((s) => s.classroomName)));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Enrolled Classes */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Classes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {data.enrolledCount}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {data.totalAssignments} active deliverables
          </span>
        </div>

        {/* Card 2: Overall Grade % */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Grade
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data.overallGradeAvg}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({data.gradedCount} graded)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.overallGradeAvg, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Completion Rate */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data.completionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {data.submittedCount}/{data.totalAssignments}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.completionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Pending Deliverables */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {data.pendingSubmissionCount}
          </div>
          <span className="text-[11px] text-amber-600 font-medium block">
            {data.pendingGradingCount} submitted awaiting review
          </span>
        </div>
      </div>

      {/* Primary Graphs Row: Completion Donut & Score Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph 1: Completion Distribution (Donut Chart) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Task Completion Status</h3>
            <p className="text-xs text-slate-500">
              Proportion of completed, graded, and pending assignments
            </p>
          </div>

          <div className="h-64 w-full my-2 flex items-center justify-center">
            {data.totalAssignments === 0 ? (
              <div className="text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto" />
                <span>No assignments assigned yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.completionDistribution}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.completionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0];
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs space-y-1">
                            <span className="font-bold text-slate-800">{d.name}</span>
                            <div className="text-slate-600">
                              Tasks: <span className="font-bold">{d.value}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Turn-In Rate</span>
            <span className="font-bold text-slate-900">{data.completionRate}%</span>
          </div>
        </div>

        {/* Graph 2: Performance Progression Line/Area Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Score Progression Over Time</h3>
              </div>
              <p className="text-xs text-slate-500">
                Grade percentages achieved across submitted assignments
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Avg: {data.overallGradeAvg}%
            </span>
          </div>

          <div className="h-64 w-full my-2">
            {data.scoreHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                <Award className="h-10 w-10 text-slate-200" />
                <span>No graded submissions recorded yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.scoreHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                            <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                              {item.assignment}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {item.subject} • {item.date}
                            </span>
                            <div className="text-indigo-600 font-bold pt-1">
                              Score: {item.earned}/{item.max} ({item.scorePercentage}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="scorePercentage"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                    activeDot={{ r: 6, fill: "#4338ca", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Chronological performance trend</span>
            <span>{data.scoreHistory.length} Graded Deliverables</span>
          </div>
        </div>
      </div>

      {/* Graph 3: Course-wise Comparison Bar Chart */}
      {data.courseBreakdown.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subject & Course Comparison</h3>
              <p className="text-xs text-slate-500">
                Comparing completion rate and average grade across each enrolled class
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {data.courseBreakdown.length} Courses
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.courseBreakdown}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="classroomName"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1.5">
                          <span className="font-bold text-slate-900 block">
                            {item.classroomName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Subject: {item.subject}
                          </span>
                          <div className="pt-1 space-y-0.5 text-xs">
                            <div className="text-teal-600 font-medium">
                              Completion: <span className="font-bold">{item.completionRate}%</span>{" "}
                              ({item.submittedCount}/{item.assignmentsCount})
                            </div>
                            <div className="text-indigo-600 font-medium">
                              Average Score: <span className="font-bold">{item.averageScore}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Bar
                  name="Completion Rate %"
                  dataKey="completionRate"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  name="Average Score %"
                  dataKey="averageScore"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Deliverables History Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Deliverable Performance History</h3>
            <p className="text-xs text-slate-500">
              Review submission details, grades, and teacher feedback
            </p>
          </div>

          {/* Course filter buttons */}
          {courseNames.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCourseFilter("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedCourseFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Courses
              </button>
              {courseNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedCourseFilter(name)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedCourseFilter === name
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No submissions recorded under this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3 pl-2">Assignment</th>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.grade !== null;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-slate-900 max-w-[220px] truncate">
                        {sub.title}
                        {sub.feedback && (
                          <span className="block text-[11px] text-slate-400 font-normal italic truncate">
                            Teacher Feedback: &quot;{sub.feedback}&quot;
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          {sub.classroomName}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formatRelativeDueDate(sub.dueDate)}</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px]">
                            <Award className="h-3 w-3" />
                            Graded
                          </span>
                        ) : sub.isSubmitted ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-[10px]">
                            <FileCheck className="h-3 w-3" />
                            Turned In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-[10px]">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        {isGraded ? (
                          <span className="font-extrabold text-slate-900">
                            {sub.grade}/{sub.maxPoints}{" "}
                            <span className="text-slate-400 text-[10px] font-normal">
                              ({Math.round((sub.grade! / sub.maxPoints) * 100)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">— / {sub.maxPoints} pts</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
