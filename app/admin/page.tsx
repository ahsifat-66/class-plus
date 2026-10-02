"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Users,
  GraduationCap,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  BookOpen,
  Filter,
  ChevronRight,
  School,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Lightbulb,
  Bug,
  Star,
  Trash2,
  Clock,
  Inbox,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  uniqueId: string;
  avatar: string | null;
  institution: string | null;
  grade: string | null;
  createdAt: string;
  teachingCount: number;
  enrolledCount: number;
  isPermanentSuperAdmin: boolean;
}

interface AdminClassroom {
  id: string;
  name: string;
  subject: string;
  code: string;
  gradeLevel: string | null;
  createdAt: string;
  teacherName: string;
  teacherEmail: string;
  studentCount: number;
  assignmentCount: number;
  announcementCount: number;
}

interface AdminStats {
  totalUsers: number;
  superAdminCount: number;
  moderatorCount: number;
  teacherCount: number;
  studentCount: number;
  totalClassrooms: number;
}

interface AdminFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  uniqueId: string;
  userRole: string;
  category: "suggestion" | "bug" | "general";
  message: string;
  status: "new" | "reviewed";
  createdAt: string;
}

interface FeedbackStats {
  total: number;
  newCount: number;
  reviewedCount: number;
  bugCount: number;
  suggestionCount: number;
  generalCount: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    isLoading: userLoading,
    isSuperAdmin,
    isModerator,
    hasAdminAccess,
    refreshUser,
  } = useUser();

  const [activeAdminTab, setActiveAdminTab] = useState<"overview" | "users" | "classes" | "feedback">("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [classrooms, setClassrooms] = useState<AdminClassroom[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // User tab search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  // Classes tab search
  const [classSearch, setClassSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Feedback tab search & filters
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<"all" | "new" | "reviewed">("all");
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<"all" | "suggestion" | "bug" | "general">("all");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersRes, feedbacksRes] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/feedbacks", { cache: "no-store" }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        setClassrooms(data.classrooms || []);
        setStats(data.stats || null);
      } else if (usersRes.status === 403) {
        setStatusMessage({
          type: "error",
          text: "Access restricted: Administrative privileges required.",
        });
      }

      if (feedbacksRes.ok) {
        const fbData = await feedbacksRes.json();
        setFeedbacks(fbData.feedbacks || []);
        setFeedbackStats(fbData.stats || null);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
      setStatusMessage({
        type: "error",
        text: "Network error loading admin console. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading) {
      if (hasAdminAccess) {
        fetchAdminData();
      } else {
        setIsLoading(false);
      }
    }
  }, [userLoading, hasAdminAccess, fetchAdminData]);

  const handleRoleChange = async (targetEmail: string, newRole: string) => {
    try {
      setUpdatingEmail(targetEmail);
      setStatusMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, newRole }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: data.message || `Role updated successfully to ${newRole}.`,
        });
        setUsers((prev) =>
          prev.map((u) => (u.email === targetEmail ? { ...u, role: newRole } : u))
        );
        await refreshUser();
        fetchAdminData();
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update role.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "Error saving role update. Please try again.",
      });
    } finally {
      setUpdatingEmail(null);
    }
  };

  const handleToggleFeedbackStatus = async (id: string, newStatus: "new" | "reviewed") => {
    try {
      setUpdatingFeedbackId(id);
      setStatusMessage(null);

      const res = await fetch("/api/admin/feedbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
        if (data.stats) setFeedbackStats(data.stats);
        setStatusMessage({
          type: "success",
          text: `Feedback marked as ${newStatus === "reviewed" ? "Reviewed" : "New"}.`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to update feedback status.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "Error updating feedback status.",
      });
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback entry?")) {
      return;
    }

    try {
      setDeletingFeedbackId(id);
      setStatusMessage(null);

      const res = await fetch(`/api/admin/feedbacks?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== id));
        if (data.stats) setFeedbackStats(data.stats);
        setStatusMessage({
          type: "success",
          text: "Feedback deleted successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "Failed to delete feedback.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "Error deleting feedback entry.",
      });
    } finally {
      setDeletingFeedbackId(null);
    }
  };

  const copyClassCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.uniqueId && u.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (roleFilter === "all") return true;
    if (roleFilter === "super_admin") return u.role === "super_admin";
    if (roleFilter === "moderator") return u.role === "moderator";
    if (roleFilter === "teacher") return u.role === "teacher" || u.role === "TEACHER";
    if (roleFilter === "student") return u.role === "student" || u.role === "STUDENT";
    return true;
  });

  // Filtered classrooms
  const filteredClassrooms = classrooms.filter((c) => {
    const q = classSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.teacherName.toLowerCase().includes(q) ||
      c.teacherEmail.toLowerCase().includes(q)
    );
  });

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((f) => {
    const q = feedbackSearch.toLowerCase().trim();
    if (q) {
      const matchText =
        f.userName.toLowerCase().includes(q) ||
        f.userEmail.toLowerCase().includes(q) ||
        f.uniqueId.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    if (feedbackStatusFilter !== "all" && f.status !== feedbackStatusFilter) {
      return false;
    }

    if (feedbackCategoryFilter !== "all" && f.category !== feedbackCategoryFilter) {
      return false;
    }

    return true;
  });

  // Access Denied Screen for unauthorized users
  if (!userLoading && (!currentUser || !hasAdminAccess)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-8 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-inner">
              <Lock strokeWidth={2} size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Access Restricted
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                The ClassPulse Administrative Console is strictly reserved for Super Administrators and appointed Moderators.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
              >
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </Link>
              <span className="text-xs text-slate-400">/</span>
              <button
                type="button"
                onClick={() => setActiveAdminTab("overview")}
                className={`text-xs font-bold transition-colors ${
                  activeAdminTab === "overview"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-500 hover:text-rose-600"
                }`}
              >
                Admin Console
              </button>
              {activeAdminTab !== "overview" && (
                <>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                    {activeAdminTab === "users"
                      ? "User Directory"
                      : activeAdminTab === "classes"
                      ? "Classrooms"
                      : "User Feedbacks"}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>Admin Dashboard</span>
              <span
                className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  isSuperAdmin
                    ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                    : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                }`}
              >
                {isSuperAdmin ? "Super Admin Tier" : "Moderator Tier"}
              </span>
            </h1>
          </div>

          <button
            onClick={fetchAdminData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Notifications / Status Feedback */}
        {statusMessage && (
          <div
            className={`rounded-2xl p-4 flex items-center gap-3 border shadow-sm animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* VIEW 1: MAIN ADMIN OVERVIEW (Compact Mobile-Optimized) */}
        {activeAdminTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Two-Tier Authority Notice */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-400/30">
                    <ShieldAlert size={13} />
                    <span>Two-Tier Authority Model</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    {isSuperAdmin
                      ? "Root Super Administrator Privileges Active"
                      : "Moderator Administrative Privileges Active"}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isSuperAdmin
                      ? "You have full platform governance authority. You may assign and update user roles between Student, Teacher, and Moderator. The permanent Super Admin account is permanently locked."
                      : "You have platform oversight authority to monitor user registrations, active roles, and classrooms. Note: Role promotions and demotions require Super Admin authority."}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-md shrink-0 space-y-1 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block">
                    Permanent Root Authority
                  </span>
                  <span className="text-sm font-mono font-extrabold text-amber-300 block">
                    abidhasansifat66@gmail.com
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 block">
                    ClassPulse ID: ADM-001 (Immutable)
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Summary Metric Cards (Moderators, Teachers, Students, Classrooms) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-sm text-center">
                <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
                <span className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-300 block">
                  {stats?.moderatorCount ?? 0}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Moderators
                </span>
              </div>

              <div className="rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-4 shadow-sm text-center">
                <GraduationCap size={20} className="text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <span className="text-2xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 block">
                  {stats?.teacherCount ?? 0}
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Teachers
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-sm text-center">
                <Users size={20} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 block">
                  {stats?.studentCount ?? 0}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Students
                </span>
              </div>

              <div className="rounded-2xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-4 shadow-sm text-center">
                <School size={20} className="text-teal-600 dark:text-teal-400 mx-auto mb-1" />
                <span className="text-2xl sm:text-3xl font-black text-teal-700 dark:text-teal-300 block">
                  {stats?.totalClassrooms ?? 0}
                </span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Classrooms
                </span>
              </div>
            </div>

            {/* Modular Action Cards */}
            <div className="mt-6 space-y-3">
              {/* Card 1: User Directory Action Button */}
              <div
                onClick={() => setActiveAdminTab("users")}
                className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Users size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      User Directory & Roles
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage {stats?.totalUsers || 0} members, unique IDs & permissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <span className="hidden sm:inline text-xs font-bold">Open Directory</span>
                  <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Classrooms Governance Action Button */}
              <div
                onClick={() => setActiveAdminTab("classes")}
                className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                    <School size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Classrooms Governance
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Supervise, inspect & manage {stats?.totalClassrooms || 0} active classes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <span className="hidden sm:inline text-xs font-bold">Inspect Classes</span>
                  <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: User Feedbacks & Inquiries Action Button */}
              <div
                onClick={() => setActiveAdminTab("feedback")}
                className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                    <MessageSquare size={22} strokeWidth={2} />
                    {(feedbackStats?.newCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-white text-[9px] font-extrabold items-center justify-center">
                          {feedbackStats?.newCount}
                        </span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        User Feedbacks & Inquiries
                      </h3>
                      {(feedbackStats?.newCount || 0) > 0 && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {feedbackStats?.newCount} New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Inspect user suggestions, bug reports, and feedback ({feedbackStats?.total || 0} total)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <span className="hidden sm:inline text-xs font-bold">Open Inbox</span>
                  <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED USER DIRECTORY & ROLES */}
        {activeAdminTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Back Button Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAdminTab("overview")}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Admin Overview</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Total Members: {stats?.totalUsers || 0}
              </span>
            </div>

            {/* Table Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span>User Directory & Role Governance</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage platform roles, unique IDs, and member permissions.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Filter size={13} />
                  <span>Filter:</span>
                </span>
                {[
                  { id: "all", label: "All Users" },
                  { id: "super_admin", label: "Super Admin" },
                  { id: "moderator", label: "Moderators" },
                  { id: "teacher", label: "Teachers" },
                  { id: "student", label: "Students" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                      roleFilter === tab.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-3">User Details</th>
                      <th className="py-3 px-3">ClassPulse ID</th>
                      <th className="py-3 px-3">Active Role</th>
                      <th className="py-3 px-3">Activity</th>
                      <th className="py-3 px-3 text-right">Role Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                          <span>Loading user directory...</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No matching users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isPermanentAdmin = u.isPermanentSuperAdmin;
                        const isUpdating = updatingEmail === u.email;

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                              isPermanentAdmin ? "bg-rose-50/30 dark:bg-rose-950/10 font-medium" : ""
                            }`}
                          >
                            {/* User Details */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                {u.avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                                    {u.name}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* ClassPulse ID */}
                            <td className="py-3 px-3">
                              <span
                                className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                                  isPermanentAdmin
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {u.uniqueId}
                              </span>
                            </td>

                            {/* Active Role */}
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                              u.role === "super_admin"
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                : u.role === "moderator"
                                ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                                : u.role === "teacher" || u.role === "TEACHER"
                                ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            }`}
                              >
                                {u.role === "super_admin" && <ShieldAlert size={12} />}
                                {u.role === "moderator" && <ShieldCheck size={12} />}
                                {u.role === "super_admin"
                                  ? "Super Admin"
                                  : u.role === "moderator"
                                  ? "Moderator"
                                  : u.role.toLowerCase() === "teacher"
                                  ? "Teacher"
                                  : "Student"}
                              </span>
                            </td>

                            {/* Activity */}
                            <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                              <div>Teaching: {u.teachingCount}</div>
                              <div>Enrolled: {u.enrolledCount}</div>
                            </td>

                            {/* Role Governance Actions */}
                            <td className="py-3 px-3 text-right">
                              {isPermanentAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl">
                                  <Lock size={12} />
                                  <span>Permanent Super Admin</span>
                                </span>
                              ) : isSuperAdmin ? (
                                <div className="inline-flex items-center gap-2">
                                  {isUpdating && <RefreshCw size={14} className="animate-spin text-indigo-500" />}
                                  <select
                                    value={u.role.toLowerCase()}
                                    disabled={isUpdating}
                                    onChange={(e) => handleRoleChange(u.email, e.target.value)}
                                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                  >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="moderator">Moderator</option>
                                  </select>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Super Admin Required
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DEDICATED CLASSROOMS GOVERNANCE */}
        {activeAdminTab === "classes" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Back Button Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAdminTab("overview")}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Admin Overview</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Total Classrooms: {classrooms.length}
              </span>
            </div>

            {/* Classrooms Governance Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <School size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Classrooms Governance & Oversight</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspect active classes, enrollment numbers, class codes, and instructors.
                  </p>
                </div>

                {/* Classrooms Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Search class, subject, teacher..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Classrooms Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="py-3 px-3">Classroom</th>
                      <th className="py-3 px-3">Class Code</th>
                      <th className="py-3 px-3">Instructor</th>
                      <th className="py-3 px-3">Metrics</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                          <span>Loading classrooms...</span>
                        </td>
                      </tr>
                    ) : filteredClassrooms.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No classrooms found matching search.
                        </td>
                      </tr>
                    ) : (
                      filteredClassrooms.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Classroom Name & Grade */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{c.subject}</span>
                              {c.gradeLevel && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    Grade: {c.gradeLevel}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Class Code */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => copyClassCode(c.code)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                              title="Click to copy class code"
                            >
                              <span>{c.code}</span>
                              {copiedCode === c.code ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} className="text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Instructor */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {c.teacherName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {c.teacherEmail}
                            </div>
                          </td>

                          {/* Metrics */}
                          <td className="py-3 px-3 text-xs text-slate-500 dark:text-slate-400">
                            <div>Students: {c.studentCount}</div>
                            <div>Tasks: {c.assignmentCount}</div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={`/classroom/${c.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition-colors"
                            >
                              <span>View Class</span>
                              <ExternalLink size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: DEDICATED USER FEEDBACKS & INQUIRIES INBOX */}
        {activeAdminTab === "feedback" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Back Button Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAdminTab("overview")}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Admin Overview</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Total Feedbacks: {feedbackStats?.total || 0} ({feedbackStats?.newCount || 0} unread)
              </span>
            </div>

            {/* Feedback Inbox Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-teal-600 dark:text-teal-400" />
                    <span>User Feedbacks & Inquiries Inbox</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review and triage reports, feature requests, and suggestions from students and teachers.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    placeholder="Search feedback text, user..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status & Category Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto font-bold">
                  {[
                    { id: "all", label: `All (${feedbackStats?.total || 0})` },
                    { id: "new", label: `Unread (${feedbackStats?.newCount || 0})` },
                    { id: "reviewed", label: `Reviewed (${feedbackStats?.reviewedCount || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeedbackStatusFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                        feedbackStatusFilter === tab.id
                          ? "bg-teal-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto font-bold">
                  {[
                    { id: "all", label: "All Categories" },
                    { id: "suggestion", label: "Suggestions" },
                    { id: "bug", label: "Bug Reports" },
                    { id: "general", label: "General" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackCategoryFilter(cat.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all whitespace-nowrap border ${
                        feedbackCategoryFilter === cat.id
                          ? "border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedbacks List */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-teal-500" />
                    <span>Loading feedbacks inbox...</span>
                  </div>
                ) : filteredFeedbacks.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Inbox size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      No feedbacks found
                    </p>
                    <p className="text-xs text-slate-400">
                      There are no feedback submissions matching your current filters.
                    </p>
                  </div>
                ) : (
                  filteredFeedbacks.map((f) => {
                    const isNew = f.status === "new";
                    const isUpdating = updatingFeedbackId === f.id;
                    const isDeleting = deletingFeedbackId === f.id;

                    const formattedDate = new Date(f.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={f.id}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-3.5 ${
                          isNew
                            ? "border-teal-200 dark:border-teal-900/60 bg-teal-50/20 dark:bg-teal-950/10 shadow-sm"
                            : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                        }`}
                      >
                        {/* Header: User identity & category */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {f.userName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {f.userName}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded">
                                  {f.uniqueId}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {f.userRole}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                                {f.userEmail}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {/* Category Badge */}
                            {f.category === "bug" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                <Bug size={12} />
                                <span>Bug Report</span>
                              </span>
                            )}
                            {f.category === "suggestion" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                                <Lightbulb size={12} />
                                <span>Suggestion</span>
                              </span>
                            )}
                            {f.category === "general" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                                <Star size={12} />
                                <span>General</span>
                              </span>
                            )}

                            {/* Status Indicator */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isNew
                                  ? "bg-rose-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {isNew ? "New" : "Reviewed"}
                            </span>
                          </div>
                        </div>

                        {/* Feedback Message Body */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {f.message}
                        </div>

                        {/* Card Footer: Timestamp & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock size={12} />
                            <span>Submitted on {formattedDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Toggle Reviewed Status */}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleToggleFeedbackStatus(
                                  f.id,
                                  isNew ? "reviewed" : "new"
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                                isNew
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {isUpdating ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              <span>
                                {isNew ? "Mark as Reviewed" : "Mark as New"}
                              </span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteFeedback(f.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-50"
                              title="Delete feedback"
                            >
                              {isDeleting ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
