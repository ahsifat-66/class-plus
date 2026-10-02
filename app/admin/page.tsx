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

interface AdminStats {
  totalUsers: number;
  superAdminCount: number;
  moderatorCount: number;
  teacherCount: number;
  studentCount: number;
  totalClassrooms: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser, isLoading: userLoading, isSuperAdmin, isModerator, hasAdminAccess, refreshUser } = useUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || null);
      } else if (res.status === 403) {
        setStatusMessage({
          type: "error",
          text: "Access restricted: Administrative privileges required.",
        });
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
        // Update local users list
        setUsers((prev) =>
          prev.map((u) => (u.email === targetEmail ? { ...u, role: newRole } : u))
        );
        // Refresh global user context in case caller changed self
        await refreshUser();
        // Reload stats
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

  // Filter users by search query and role tab
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
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Admin Console
              </span>
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

        {/* System Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-center">
            <Users size={18} className="text-slate-600 dark:text-slate-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-slate-900 dark:text-white block">
              {stats?.totalUsers ?? 0}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Users
            </span>
          </div>

          <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 shadow-sm text-center">
            <ShieldAlert size={18} className="text-rose-600 dark:text-rose-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 block">
              {stats?.superAdminCount ?? 1}
            </span>
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 shadow-sm text-center">
            <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 block">
              {stats?.moderatorCount ?? 0}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Moderators
            </span>
          </div>

          <div className="rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-4 shadow-sm text-center">
            <GraduationCap size={18} className="text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300 block">
              {stats?.teacherCount ?? 0}
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Teachers
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-sm text-center">
            <Users size={18} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 block">
              {stats?.studentCount ?? 0}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Students
            </span>
          </div>

          <div className="rounded-2xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-4 shadow-sm text-center">
            <BookOpen size={18} className="text-teal-600 dark:text-teal-400 mx-auto mb-1" />
            <span className="text-2xl font-black text-teal-700 dark:text-teal-300 block">
              {stats?.totalClassrooms ?? 0}
            </span>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Classrooms
            </span>
          </div>
        </div>

        {/* User Directory & Role Manager Table Card */}
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
                          isPermanentAdmin
                            ? "bg-rose-50/30 dark:bg-rose-950/10 font-medium"
                            : ""
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
      </main>
    </div>
  );
}
