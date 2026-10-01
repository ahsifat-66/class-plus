"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import CreateClassModal from "@/components/CreateClassModal";
import JoinClassModal from "@/components/JoinClassModal";
import LeaveClassroomModal from "@/components/LeaveClassroomModal";
import {
  BookOpen,
  Users,
  Copy,
  Check,
  Plus,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Hash,
  FileCheck,
  Clock,
  LogIn,
  LogOut,
  MoreVertical,
  GraduationCap,
  Award,
  AlertCircle,
  Calendar,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Flame,
  X,
  FolderPlus,
  CheckCircle2,
  CalendarClock,
  BookMarked,
  Search,
  Filter,
  Download,
} from "lucide-react";
import { formatRelativeDueDate } from "@/lib/utils";
import StudentAnalyticsView from "@/components/analytics/StudentAnalyticsView";
import TeacherAnalyticsView from "@/components/analytics/TeacherAnalyticsView";

export const dynamic = "force-dynamic";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  code: string;
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
  enrollments: Array<{ id: string; user: { id: string; name: string } }>;
  assignments: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    maxPoints: number;
    submissions?: Array<{
      id: string;
      grade: number | null;
      studentId: string;
    }>;
  }>;
  channels: Array<{ id: string; name: string }>;
  announcements: Array<{ id: string; title: string }>;
}

function getLocalizedDeadlineStatus(
  dueDateStr: string,
  t: (key: string, fallback?: string) => string
): { label: string; isOverdue: boolean; isDueSoon: boolean } {
  const now = new Date().getTime();
  const due = new Date(dueDateStr).getTime();
  const diffMs = due - now;

  if (diffMs < 0) {
    const diffHoursAgo = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    if (diffHoursAgo < 24) {
      const h = diffHoursAgo || 1;
      return {
        label: t("deadlines.overdueByHours", `Overdue by ${h}h`).replace("{n}", String(h)),
        isOverdue: true,
        isDueSoon: false,
      };
    }
    const diffDaysAgo = Math.floor(diffHoursAgo / 24);
    return {
      label: t("deadlines.overdueByDays", `Overdue by ${diffDaysAgo}d`).replace("{n}", String(diffDaysAgo)),
      isOverdue: true,
      isDueSoon: false,
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return {
      label: t("deadlines.dueInMinutes", `Due in ${diffMinutes}m`).replace("{n}", String(diffMinutes)),
      isOverdue: false,
      isDueSoon: true,
    };
  }
  if (diffHours < 24) {
    return {
      label: t("deadlines.dueInHours", `Due in ${diffHours}h`).replace("{n}", String(diffHours)),
      isOverdue: false,
      isDueSoon: true,
    };
  }
  const diffDays = Math.ceil(diffHours / 24);
  if (diffDays === 1) {
    return { label: t("deadlines.dueTomorrow", "Due tomorrow"), isOverdue: false, isDueSoon: true };
  }
  return {
    label: t("deadlines.dueInDays", `Due in ${diffDays} days`).replace("{n}", String(diffDays)),
    isOverdue: false,
    isDueSoon: diffDays <= 3,
  };
}

function UnifiedDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const errorParam = searchParams.get("error");

  const { currentUser, userSummary, refreshUser } = useUser();
  const { t, language } = useLanguage();

  // Mode state: "teaching", "enrolled", "deadlines", or "analytics"
  const [activeTab, setActiveTab] = useState<"teaching" | "enrolled" | "deadlines" | "analytics">("teaching");

  const [teachingClasses, setTeachingClasses] = useState<Classroom[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<Classroom[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [leavingClassroom, setLeavingClassroom] = useState<Classroom | null>(null);
  const [enrolledCardMenuOpenId, setEnrolledCardMenuOpenId] = useState<string | null>(null);



  // Analytics states for embedded dashboard analytics
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [teacherAnalyticsData, setTeacherAnalyticsData] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsRoleView, setAnalyticsRoleView] = useState<"student" | "teacher">("student");

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const [meRes, teacherRes] = await Promise.all([
        fetch("/api/analytics/me", { cache: "no-store" }),
        fetch("/api/analytics/teacher", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const d = await meRes.json();
        setAnalyticsData(d);
      }
      if (teacherRes.ok) {
        const td = await teacherRes.json();
        setTeacherAnalyticsData(td);
      }
    } catch (e) {
      console.error("Failed to load analytics in dashboard", e);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Focus Pomodoro Timer states for Student Learning Center
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState("General");
  const [studySessionLogged, setStudySessionLogged] = useState<string | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleLogStudySession(timerMinutes, `Completed ${timerMinutes}m Pomodoro session`);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeftSeconds, timerMinutes]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = (mins = timerMinutes) => {
    setIsTimerRunning(false);
    setTimeLeftSeconds(mins * 60);
  };
  const handleSetTimerMinutes = (mins: number) => {
    setTimerMinutes(mins);
    handleResetTimer(mins);
  };

  const handleLogStudySession = async (mins: number, note?: string) => {
    try {
      const res = await fetch("/api/student/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: timerSubject || "General",
          durationMinutes: mins,
          notes: note || `Logged ${mins}m focus session`,
        }),
      });
      if (res.ok) {
        setStudySessionLogged(`Logged ${mins}m focus time for ${timerSubject}!`);
        setTimeout(() => setStudySessionLogged(null), 4000);
      }
    } catch (e) {
      console.error("Failed to log study session", e);
    }
  };

  // Set initial tab from query param or role
  useEffect(() => {
    if (viewParam === "deadlines") {
      setActiveTab("deadlines");
    } else if (viewParam === "enrolled") {
      setActiveTab("enrolled");
    } else if (viewParam === "teaching") {
      setActiveTab("teaching");
    } else if (viewParam === "analytics") {
      setActiveTab("analytics");
    } else if (currentUser?.role === "STUDENT" && !viewParam) {
      setActiveTab("enrolled");
    }
  }, [viewParam, currentUser]);

  useEffect(() => {
    if (activeTab === "analytics" && !analyticsData) {
      fetchAnalytics();
    }
  }, [activeTab, analyticsData, fetchAnalytics]);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      const res = await fetch("/api/classrooms");
      if (res.ok) {
        const data = await res.json();
        setTeachingClasses(data.teaching || []);
        setEnrolledClasses(data.enrolled || []);
      }
      await refreshUser();
    } catch (e) {
      console.error("Failed to load classrooms", e);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTabChange = (tab: "teaching" | "enrolled" | "deadlines" | "analytics") => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("view", tab);
    window.history.pushState({}, "", newUrl.toString());
  };

  const totalTeachingStudents = teachingClasses.reduce(
    (acc, c) => acc + (c.enrollments?.length || 0),
    0
  );

  // Filter Due Soon assignments across all enrolled classes
  const dueSoonTasks = enrolledClasses
    .flatMap((c) =>
      c.assignments.map((a) => {
        const mySubmission = a.submissions?.find(
          (s) => s.studentId === currentUser?.id
        );
        return {
          ...a,
          classroomName: c.name,
          classroomId: c.id,
          isSubmitted: !!mySubmission,
          grade: mySubmission?.grade,
        };
      })
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Aggregate all active assignments from enrolled classes (and teaching classes if teacher) with a dueDate
  const upcomingDeadlines = React.useMemo(() => {
    const enrolledTasks = enrolledClasses.flatMap((cls) =>
      cls.assignments
        .filter((a) => !!a.dueDate)
        .map((a) => {
          const mySubmission = a.submissions?.find(
            (s) => s.studentId === currentUser?.id
          );
          return {
            ...a,
            classroomId: cls.id,
            classroomName: cls.name,
            subject: cls.subject,
            isSubmitted: !!mySubmission,
            grade: mySubmission?.grade,
          };
        })
    );

    const teachingTasks =
      currentUser?.role === "TEACHER" && enrolledClasses.length === 0
        ? teachingClasses.flatMap((cls) =>
            cls.assignments
              .filter((a) => !!a.dueDate)
              .map((a) => ({
                ...a,
                classroomId: cls.id,
                classroomName: cls.name,
                subject: cls.subject,
                isSubmitted: false,
                grade: null,
              }))
          )
        : [];

    return [...enrolledTasks, ...teachingTasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [enrolledClasses, teachingClasses, currentUser?.id, currentUser?.role]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onCreateClassOpen={() => setIsCreateOpen(true)}
        onJoinClassOpen={() => setIsJoinOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 space-y-8">
        {/* Role Access Notice if redirected with notice */}
        {errorParam && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-xs sm:text-sm text-amber-900 shadow-sm animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">{t("common.notice", "Notice:")} </span>
              {errorParam}
            </div>
          </div>
        )}

        {/* Top View Selector Bar & Dual Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Tabs Pill Switcher */}
          <div className="flex overflow-x-auto w-full sm:w-auto rounded-xl bg-slate-100 p-1 border border-slate-200 scrollbar-none">
            <button
              onClick={() => handleTabChange("teaching")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[38px] ${
                activeTab === "teaching"
                  ? "bg-white text-purple-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
              <span>{t("dashboard.tabTeaching", "Teaching")}</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  activeTab === "teaching"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {teachingClasses.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("enrolled")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[38px] ${
                activeTab === "enrolled"
                  ? "bg-white text-emerald-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{t("dashboard.tabEnrolled", "Enrolled")}</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  activeTab === "enrolled"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {enrolledClasses.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("deadlines")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[38px] ${
                activeTab === "deadlines"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarClock className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
              <span>{t("dashboard.tabDeadlines", "Deadlines")}</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  activeTab === "deadlines"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {upcomingDeadlines.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("analytics")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[38px] ${
                activeTab === "analytics"
                  ? "bg-white text-indigo-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>{t("dashboard.tabAnalytics", "Analytics")}</span>
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                  activeTab === "analytics"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {t("analytics.livePill", "Live")}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-purple-700 transition-all active:scale-95 min-h-[38px]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>{t("navbar.createClass", "Create Class")}</span>
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95 min-h-[38px]"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span>{t("navbar.joinClass", "Join Class")}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TEACHING VIEW */}
        {activeTab === "teaching" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Teacher Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md border border-purple-400/20">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
                    <span>{t("dashboard.teacherWorkspace", "Faculty & Teaching Workspace")}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {t("dashboard.welcome", "Welcome back")}, {currentUser?.name || (language === "bn" ? "শিক্ষক" : "Professor")}
                  </h1>
                  <p className="text-sm text-purple-200 max-w-2xl leading-relaxed">
                    {t(
                      "dashboard.teacherWorkspaceSubtitle",
                      "Manage your active courses, draft AI announcements, post assignments, and grade student submissions."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/teacher/analytics"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-sm font-bold text-white transition-all"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{t("dashboard.teacherAnalytics", "Teacher Analytics")}</span>
                  </Link>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("dashboard.createClassroom", "Create Classroom")}</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <span className="text-xs text-purple-300 block">{t("dashboard.classrooms", "Classrooms")}</span>
                  <span className="text-xl font-bold text-white">{teachingClasses.length}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-300 block">{t("dashboard.totalStudents", "Total Students")}</span>
                  <span className="text-xl font-bold text-white">{totalTeachingStudents}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-300 block">{t("dashboard.status", "Status")}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                    {t("dashboard.instructor", "Instructor")}
                  </span>
                </div>
              </div>
            </div>

            {/* Teaching Courses Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-slate-900">{t("dashboard.coursesYouTeach", "Courses You Teach")}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {teachingClasses.length} {t("dashboard.classesCount", "Classes")}
                </span>
              </div>

              {isLoadingClasses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-56 rounded-3xl border border-slate-200 bg-white p-6 animate-pulse" />
                  ))}
                </div>
              ) : teachingClasses.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                    <FolderPlus className="h-8 w-8" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t("dashboard.createOrJoin", "Create or Join a Classroom")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {t(
                        "dashboard.createFirstCourseDesc",
                        "Create your first course to start sharing assignments, announcements, and managing discussion channels."
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all min-h-[44px]"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                      <span>{t("dashboard.createClassroom", "Create Classroom")}</span>
                    </button>
                    <button
                      onClick={() => setIsJoinOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[44px]"
                    >
                      <LogIn className="h-4 w-4" strokeWidth={1.75} />
                      <span>{t("dashboard.joinClassroom", "Join Classroom")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teachingClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full truncate max-w-[170px]">
                            {cls.subject}
                          </span>

                          <button
                            onClick={() => copyCode(cls.code)}
                            title="Click to copy join code"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <span>{cls.code}</span>
                            {copiedCode === cls.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <Link href={`/classroom/${cls.id}`}>
                          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                            {cls.name}
                          </h3>
                        </Link>

                        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.enrollments?.length || 0} {t("dashboard.studentsUnit", "students")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.channels?.length || 0} {t("dashboard.channelsUnit", "channels")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.assignments?.length || 0} {t("dashboard.tasksUnit", "tasks")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {cls.announcements?.length || 0} {t("dashboard.announcementsUnit", "announcements")}
                        </span>
                        <Link
                          href={`/classroom/${cls.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-800 px-3.5 py-1.5 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all"
                        >
                          <span>{t("dashboard.manageClass", "Manage Class")}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ENROLLED VIEW */}
        {activeTab === "enrolled" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Student Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md border border-emerald-400/20">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{t("dashboard.studentCenter", "Student Learning Center")}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {t("dashboard.welcome", "Welcome back")}, {currentUser?.name || (language === "bn" ? "শিক্ষার্থী" : "Student")}
                  </h1>
                  <p className="text-sm text-emerald-200 max-w-2xl leading-relaxed">
                    {t(
                      "dashboard.studentCenterSubtitle",
                      "Check upcoming deliverables, collaborate in discussion channels, and ask the Socratic AI Tutor for guided assistance."
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/student/locker"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-800/60 hover:bg-emerald-800 border border-emerald-500/30 px-4 py-3 text-sm font-bold text-white transition-all shadow-sm active:scale-95"
                  >
                    <BookOpen className="h-4 w-4 text-emerald-300" />
                    <span>{t("dashboard.academicLocker", "Academic Locker")}</span>
                  </Link>
                  <Link
                    href="/dashboard/student/analytics"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{t("dashboard.myAnalytics", "My Analytics")}</span>
                  </Link>
                  <button
                    onClick={() => setIsJoinOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{t("dashboard.joinWithCode", "Join with Code")}</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <span className="text-xs text-emerald-300 block">{t("dashboard.enrolledCourses", "Enrolled Courses")}</span>
                  <span className="text-xl font-bold text-white">{enrolledClasses.length}</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-300 block">{t("dashboard.upcomingTasks", "Upcoming Tasks")}</span>
                  <span className="text-xl font-bold text-white">{dueSoonTasks.length}</span>
                </div>
                <div>
                  <span className="text-xs text-emerald-300 block">{t("dashboard.status", "Status")}</span>
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                    {t("dashboard.student", "Student")}
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Toast for logged study session */}
            {studySessionLogged && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-emerald-800 animate-in fade-in">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>{studySessionLogged}</span>
                </div>
                <button
                  onClick={() => setStudySessionLogged(null)}
                  className="text-emerald-500 hover:text-emerald-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Focus Study Timer & Self-Study Access */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {t("pomodoro.title", "Focus Study & Pomodoro Timer")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t(
                        "pomodoro.subtitle",
                        "Structured productivity intervals to maximize retention and track study progress."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/student/locker"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t("dashboard.openLocker", "Open Locker")}</span>
                  </Link>
                  <Link
                    href="/dashboard/student/analytics"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{t("dashboard.viewAnalytics", "View Analytics")}</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
                {/* Timer Display */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">
                    {String(Math.floor(timeLeftSeconds / 60)).padStart(2, "0")}:
                    {String(timeLeftSeconds % 60).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
                    {isTimerRunning ? (
                      <>
                        <Clock strokeWidth={1.75} size={12} className="text-emerald-500 animate-spin" />
                        <span>{t("pomodoro.active", "Focus Timer Active")}</span>
                      </>
                    ) : (
                      <span>{t("pomodoro.ready", "Timer Ready")}</span>
                    )}
                  </span>
                </div>

                {/* Subject and Duration Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">{t("pomodoro.selectSubject", "Subject")}:</span>
                    <select
                      value={timerSubject}
                      onChange={(e) => setTimerSubject(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="General">General</option>
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                      <option value="Physics">Physics</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="History">History</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t("pomodoro.duration", "Duration")}:</span>
                    {[15, 25, 45].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSetTimerMinutes(m)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          timerMinutes === m
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center md:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleResetTimer(timerMinutes)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    title={t("pomodoro.reset", "Reset Timer")}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {isTimerRunning ? (
                    <button
                      type="button"
                      onClick={handlePauseTimer}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>{t("pomodoro.pause", "Pause")}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-200 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{t("pomodoro.start", "Start Focus")}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLogStudySession(timerMinutes, `Dashboard Pomodoro (${timerMinutes}m)`)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline px-2 py-1"
                    title="Instantly log this session without running the timer"
                  >
                    {t("pomodoro.logSession", "Log Session")}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Center: Due Soon Queue */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t("dashboard.actionCenterDueSoon", "Action Center: Due Soon")}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {t("dashboard.priorityQueue", "Priority Queue across all enrolled courses")}
                </span>
              </div>

              {dueSoonTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dueSoonTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          {task.classroomName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {task.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          <span>{formatRelativeDueDate(task.dueDate)}</span>
                        </div>

                        {task.isSubmitted ? (
                          task.grade !== null && task.grade !== undefined ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                              <Award className="h-3 w-3" strokeWidth={1.75} />
                              {task.grade}/{task.maxPoints} {t("dashboard.pts", "pts")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px]">
                              <FileCheck className="h-3 w-3" strokeWidth={1.75} />
                              {t("dashboard.turnedIn", "Turned In")}
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                            <AlertCircle className="h-3 w-3" strokeWidth={1.75} />
                            {t("dashboard.pending", "Pending")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t("dashboard.allCompleted", "All coursework completed. No pending assignments.")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("dashboard.allCaughtUp", "You are caught up across all your enrolled courses.")}
                  </p>
                </div>
              )}
            </div>

            {/* Enrolled Courses Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" strokeWidth={1.75} />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("dashboard.yourEnrolledCourses", "Your Enrolled Courses")}</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {enrolledClasses.length} {t("dashboard.classesCount", "Courses")}
                </span>
              </div>

              {isLoadingClasses ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-56 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse" />
                  ))}
                </div>
              ) : enrolledClasses.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <FolderPlus className="h-8 w-8" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {t("dashboard.createOrJoin", "Create or Join a Classroom")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {t(
                        "dashboard.askTeacherCode",
                        "Ask your teacher for a 6-character class code, or click below to enroll in a course."
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => setIsJoinOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all min-h-[44px]"
                    >
                      <LogIn className="h-4 w-4" strokeWidth={1.75} />
                      <span>{t("dashboard.joinClassroom", "Join Classroom")}</span>
                    </button>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[44px]"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                      <span>{t("dashboard.createClassroom", "Create Classroom")}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full truncate max-w-[170px]">
                            {cls.subject}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-400">
                              {t("dashboard.instructorPrefix", "Instructor")}: {cls.teacher?.name?.split(" ")[0] || (language === "bn" ? "শিক্ষক" : "Faculty")}
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEnrolledCardMenuOpenId(
                                    enrolledCardMenuOpenId === cls.id ? null : cls.id
                                  );
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Classroom options"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {enrolledCardMenuOpenId === cls.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEnrolledCardMenuOpenId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 mt-1 w-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEnrolledCardMenuOpenId(null);
                                        setLeavingClassroom(cls);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                    >
                                      <LogOut size={14} />
                                      <span>{t("dashboard.leaveClass", "Leave Class")}</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Link href={`/classroom/${cls.id}`}>
                          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {cls.name}
                          </h3>
                        </Link>

                        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.enrollments?.length || 0} {t("dashboard.peersUnit", "peers")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.channels?.length || 0} {t("dashboard.channelsUnit", "channels")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                            <span>{cls.assignments?.length || 0} {t("dashboard.tasksUnit", "tasks")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {cls.announcements?.length || 0} {t("dashboard.announcementsUnit", "announcements")}
                        </span>
                        <Link
                          href={`/classroom/${cls.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-800 px-3.5 py-1.5 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          <span>{t("dashboard.enterClass", "Enter Class")}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DEADLINES VIEW */}
        {activeTab === "deadlines" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Deadlines Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur-md border border-amber-400/20">
                    <CalendarClock className="h-3.5 w-3.5 text-amber-300" strokeWidth={1.75} />
                    <span>{t("deadlines.headerBadge", "Academic Deadlines & Schedule")}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {t("deadlines.upcomingDeliverables", "Upcoming Deliverables")}
                  </h1>
                  <p className="text-sm text-amber-200/90 max-w-2xl leading-relaxed">
                    {t(
                      "deadlines.deadlinesSubtitle",
                      "All active coursework deadlines across your enrolled classes, sorted chronologically to help you plan your study sessions."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/student/locker"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-sm font-bold text-white transition-all active:scale-95"
                  >
                    <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                    <span>{t("dashboard.academicLocker", "Academic Locker")}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Deadlines Content */}
            {upcomingDeadlines.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t("deadlines.noUpcoming", "No upcoming deadlines")}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {t("deadlines.allCaughtUp", "You are all caught up with your coursework.")}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => handleTabChange("enrolled")}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all min-h-[44px]"
                  >
                    <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
                    <span>{t("deadlines.viewEnrolledClasses", "View Enrolled Classes")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingDeadlines.map((task) => {
                  const status = getLocalizedDeadlineStatus(task.dueDate, t);
                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full truncate max-w-[170px]">
                            {task.classroomName}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              status.isOverdue
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50"
                                : status.isDueSoon
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <Clock className="h-3 w-3" strokeWidth={1.75} />
                            {status.label}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                            <span>
                              {t("dashboard.due", "Due")}:{" "}
                              {new Date(task.dueDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                            <Award className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.75} />
                            <span>{task.maxPoints} {t("dashboard.pts", "pts")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          {task.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span>{t("deadlines.submitted", "Submitted")}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {t("deadlines.pendingSubmission", "Pending Submission")}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/classroom/${task.classroomId}?tab=assignments`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-bold transition-all min-h-[36px]"
                        >
                          <span>{t("deadlines.openAssignment", "Open Assignment")}</span>
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS VIEW */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Analytics Hero Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md border border-white/10">
                    <BarChart3 className="h-3.5 w-3.5 text-indigo-300" />
                    <span>{t("analytics.interactiveGraphs", "Live Interactive Graphs")}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {analyticsRoleView === "student"
                      ? t("analytics.studentPerformance", "Your Academic Performance")
                      : t("analytics.facultyAnalytics", "Faculty Analytics & Student Directory")}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                    {t(
                      "analytics.chartsSubtitle",
                      "Interactive charts for completion rates, chronological score trends, and individual student drill-down."
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Perspective switcher if user has both roles */}
                  {(currentUser?.role === "TEACHER" || (userSummary?.teachingCount ?? 0) > 0) && (
                    <div className="inline-flex rounded-xl bg-white/10 p-1 backdrop-blur-md border border-white/10">
                      <button
                        onClick={() => setAnalyticsRoleView("student")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          analyticsRoleView === "student"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {t("analytics.studentView", "Student View")}
                      </button>
                      <button
                        onClick={() => setAnalyticsRoleView("teacher")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          analyticsRoleView === "teacher"
                            ? "bg-white text-purple-900 shadow-sm"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {t("analytics.teacherView", "Teacher View")}
                      </button>
                    </div>
                  )}

                  <Link
                    href="/analytics"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all"
                  >
                    <span>{t("analytics.fullHub", "Full Analytics Hub")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {isLoadingAnalytics && !analyticsData ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <span>{t("analytics.loadingCharts", "Loading interactive charts...")}</span>
              </div>
            ) : (
              <>
                {analyticsRoleView === "student" && analyticsData?.student && (
                  <StudentAnalyticsView data={analyticsData.student} />
                )}

                {analyticsRoleView === "teacher" && analyticsData?.teacher && (
                  <TeacherAnalyticsView
                    overviewData={analyticsData.teacher}
                    classesList={teacherAnalyticsData?.classes || []}
                    studentsList={teacherAnalyticsData?.students || []}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={fetchAllData}
      />

      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={fetchAllData}
      />

      <LeaveClassroomModal
        isOpen={!!leavingClassroom}
        onClose={() => setLeavingClassroom(null)}
        classroomId={leavingClassroom?.id || ""}
        classroomName={leavingClassroom?.name || "Class"}
        onSuccess={() => {
          fetchAllData();
        }}
      />
    </div>
  );
}

export default function UnifiedDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-xs text-slate-400">Loading Dashboard...</div>
        </div>
      }
    >
      <UnifiedDashboardContent />
    </Suspense>
  );
}
