"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";

interface NavbarProps {
  onCreateClassOpen?: () => void;
  onJoinClassOpen?: () => void;
}

export default function Navbar({
  onCreateClassOpen,
  onJoinClassOpen,
}: NavbarProps) {
  const { currentUser, userSummary, isLoading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Derive dynamic role badge: "Teacher & Student", "Teacher", or "Student"
  const activeRoleBadge =
    userSummary?.activeRole ||
    (currentUser?.role === "TEACHER" ? "Teacher" : "Student");

  const homeLink = "/dashboard";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {}
    try {
      localStorage.removeItem("classpulse_user_cache");
    } catch (e) {}
    window.location.href = "/login";
  };

  const getInitials = (name?: string) => {
    if (!name) return "CP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href={homeLink} className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Class<span className="text-indigo-600">Pulse</span>
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                Hub for Teachers & Students
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right Section */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-28 bg-slate-100 animate-pulse rounded-xl" />
          ) : currentUser ? (
            <>
              {/* Dual Action Buttons: Both Create Class and Join Class */}
              <div className="flex items-center gap-2">
                {onCreateClassOpen && (
                  <button
                    onClick={onCreateClassOpen}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-all active:scale-95"
                    title="Create a new course as Teacher"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Class</span>
                  </button>
                )}

                {onJoinClassOpen && (
                  <button
                    onClick={onJoinClassOpen}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
                    title="Join an existing course via class code"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Join Class</span>
                  </button>
                )}

                <Link
                  href="/analytics"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                  title="View Analytics & Performance Dashboard"
                >
                  <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>
              </div>

              {/* Profile Avatar Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1.5 sm:px-2.5 sm:py-1.5 text-left shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 focus:outline-none"
                  aria-expanded={dropdownOpen}
                >
                  <div className="relative">
                    {currentUser.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-sm">
                        {getInitials(currentUser.name)}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        activeRoleBadge.includes("Teacher") ? "bg-purple-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="font-semibold text-slate-900 truncate max-w-[120px] text-xs">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        activeRoleBadge.includes("Teacher") && activeRoleBadge.includes("Student")
                          ? "text-indigo-600 font-extrabold"
                          : activeRoleBadge.includes("Teacher")
                          ? "text-purple-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {activeRoleBadge}
                    </span>
                  </div>

                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Header */}
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm truncate max-w-[170px]">
                            {currentUser.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeRoleBadge.includes("Teacher") && activeRoleBadge.includes("Student")
                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                : activeRoleBadge.includes("Teacher")
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {activeRoleBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>

                      {/* Quick Dashboard Toggles */}
                      <div className="py-1 border-b border-slate-100 space-y-0.5">
                        <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Workspace Navigation
                        </div>

                        <Link
                          href="/dashboard?view=teaching"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-purple-600" />
                            <span>Teaching Dashboard</span>
                          </div>
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {userSummary?.teachingCount || 0}
                          </span>
                        </Link>

                        <Link
                          href="/dashboard?view=enrolled"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                            <span>Student Dashboard</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            {userSummary?.enrolledCount || 0}
                          </span>
                        </Link>

                        <Link
                          href="/analytics"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-indigo-600" />
                            <span>Analytics & Graphs</span>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            Charts
                          </span>
                        </Link>
                      </div>

                      {/* Profile & Account Settings */}
                      <div className="py-1 border-b border-slate-100">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-colors"
                        >
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span>Profile & Academic Details</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Strictly two clean options for unauthenticated visitors */
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
