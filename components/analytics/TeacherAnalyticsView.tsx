"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  BookOpen,
  FileCheck,
  Award,
  Search,
  ChevronRight,
  X,
  GraduationCap,
  Calendar,
  Clock,
  TrendingUp,
  Mail,
  School,
  CheckCircle2,
} from "lucide-react";
import { formatRelativeDueDate } from "@/lib/utils";

interface StudentItem {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  institution: string | null;
  grade: string | null;
  classrooms: Array<{ id: string; name: string; subject: string }>;
  totalAssignments: number;
  submittedCount: number;
  gradedCount: number;
  completionRate: number;
  averageGrade: number | null;
}

interface TeacherAnalyticsViewProps {
  overviewData: {
    createdCoursesCount: number;
    totalStudentsCount: number;
    assignmentsPostedCount: number;
    submissionsReceivedCount: number;
    ungradedCount: number;
    gradingRate: number;
    classEnrollmentData: Array<{
      name: string;
      subject: string;
      studentsCount: number;
      assignmentsCount: number;
      submissionsCount: number;
    }>;
  };
  classesList: Array<{
    id: string;
    name: string;
    subject: string;
    code: string;
    studentCount: number;
    assignmentCount: number;
  }>;
  studentsList: StudentItem[];
}

export default function TeacherAnalyticsView({
  overviewData,
  classesList,
  studentsList,
}: TeacherAnalyticsViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Drill-down student state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<any | null>(null);
  const [isLoadingDrillDown, setIsLoadingDrillDown] = useState(false);

  // Filter students by selected class and search query
  const filteredStudents = studentsList.filter((s) => {
    const matchesClass =
      selectedClassId === "ALL" ||
      s.classrooms.some((c) => c.id === selectedClassId);

    const matchesSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesClass && matchesSearch;
  });

  const handleOpenStudentDrillDown = async (studentId: string) => {
    setSelectedStudentId(studentId);
    try {
      setIsLoadingDrillDown(true);
      const res = await fetch(`/api/analytics/student/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setDrillDownData(data);
      }
    } catch (e) {
      console.error("Failed to load student analytics drill-down", e);
    } finally {
      setIsLoadingDrillDown(false);
    }
  };

  const handleCloseDrillDown = () => {
    setSelectedStudentId(null);
    setDrillDownData(null);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Faculty KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Students */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {overviewData.totalStudentsCount}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Across {overviewData.createdCoursesCount} active courses
          </span>
        </div>

        {/* Metric 2: Submissions Received */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Submissions Received
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {overviewData.submissionsReceivedCount}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {overviewData.assignmentsPostedCount} assignments posted
          </span>
        </div>

        {/* Metric 3: Grading Rate */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Grading Rate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {overviewData.gradingRate}%
            </span>
            <span className="text-xs font-semibold text-slate-400">graded</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overviewData.gradingRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Ungraded Backlog */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ungraded Submissions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {overviewData.ungradedCount}
          </div>
          <span className="text-[11px] text-amber-600 font-medium block">
            {overviewData.ungradedCount === 0
              ? "All submissions graded"
              : "Awaiting teacher review"}
          </span>
        </div>
      </div>

      {/* Course Enrollment & Submissions Graph */}
      {overviewData.classEnrollmentData.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Class Activity & Student Volume</h3>
              <p className="text-xs text-slate-500">
                Breakdown of enrollment, assignments, and deliverables per course
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {overviewData.classEnrollmentData.length} Courses
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overviewData.classEnrollmentData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[11px] text-slate-400 block">{item.subject}</span>
                          <div className="pt-1 text-xs space-y-0.5">
                            <div className="text-purple-600 font-medium">
                              Enrolled Students: <span className="font-bold">{item.studentsCount}</span>
                            </div>
                            <div className="text-indigo-600 font-medium">
                              Assignments Posted: <span className="font-bold">{item.assignmentsCount}</span>
                            </div>
                            <div className="text-emerald-600 font-medium">
                              Deliverables Received: <span className="font-bold">{item.submissionsCount}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Bar name="Students" dataKey="studentsCount" fill="#9333ea" radius={[6, 6, 0, 0]} />
                <Bar name="Assignments" dataKey="assignmentsCount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar name="Submissions" dataKey="submissionsCount" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Student Directory & Drill-Down Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">
                Student Performance Directory
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any student to drill down into their personal metrics and charts
            </p>
          </div>

          {/* Filters: Class Selector Dropdown & Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Classroom Dropdown Filter */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Classrooms ({studentsList.length} students)</option>
              {classesList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} students)
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none w-full sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Student Cards Grid / Table */}
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 space-y-2">
            <Users className="h-8 w-8 text-slate-300 mx-auto" />
            <span>No students found matching your selected filter.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpenStudentDrillDown(s.id)}
                className="cursor-pointer rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50/50 hover:bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-purple-500/20"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-sm">
                        {getInitials(s.name)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                        {s.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {s.email}
                      </p>
                    </div>
                  </div>

                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Submissions</span>
                    <span className="text-xs font-bold text-slate-800">
                      {s.submittedCount}/{s.totalAssignments}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Turn-In Rate</span>
                    <span className="text-xs font-bold text-teal-600">
                      {s.completionRate}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Avg Grade</span>
                    <span className="text-xs font-bold text-indigo-600">
                      {s.averageGrade !== null ? `${s.averageGrade}%` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drill-Down Student Analytics Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Student Analytics Drill-Down</h2>
                  <p className="text-xs text-slate-500">
                    Individual performance profile, charts, and deliverable history
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
                {/* Student Hero Info */}
                <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {drillDownData.student.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={drillDownData.student.avatar}
                        alt={drillDownData.student.name}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-purple-500/20"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-lg shadow-sm">
                        {getInitials(drillDownData.student.name)}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {drillDownData.student.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {drillDownData.student.email}
                        </span>
                        {drillDownData.student.grade && (
                          <span>• Grade: {drillDownData.student.grade}</span>
                        )}
                        {drillDownData.student.institution && (
                          <span className="flex items-center gap-1">
                            <School className="h-3 w-3 text-slate-400" />
                            {drillDownData.student.institution}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Average Score
                      </span>
                      <span className="text-xl font-extrabold text-indigo-600">
                        {drillDownData.metrics.averageGrade !== null
                          ? `${drillDownData.metrics.averageGrade}%`
                          : "No Grades"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drill-down Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Completion Donut */}
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Assignment Status
                    </h4>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={drillDownData.completionDistribution}
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {drillDownData.completionDistribution.map(
                              (entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Score Progression Area */}
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Grade Progression
                    </h4>
                    <div className="h-52 w-full">
                      {drillDownData.scoreProgression.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No graded submissions yet
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={drillDownData.scoreProgression}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="studentScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} unit="%" />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="scorePercentage"
                              stroke="#9333ea"
                              strokeWidth={2}
                              fill="url(#studentScore)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submissions & Deliverables Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Deliverables & Grades in Your Classes
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                          <th className="p-3">Assignment</th>
                          <th className="p-3">Course</th>
                          <th className="p-3">Due Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {drillDownData.assignments.map((a: any) => {
                          const isGraded = a.grade !== null;
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900 max-w-[180px] truncate">
                                {a.title}
                              </td>
                              <td className="p-3 text-slate-500">{a.classroomName}</td>
                              <td className="p-3 text-slate-500">
                                {formatRelativeDueDate(a.dueDate)}
                              </td>
                              <td className="p-3">
                                {isGraded ? (
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                                    Graded
                                  </span>
                                ) : a.isSubmitted ? (
                                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">
                                    Turned In
                                  </span>
                                ) : (
                                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                {isGraded ? `${a.grade}/${a.maxPoints} pts` : `— / ${a.maxPoints}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Failed to load student analytics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
