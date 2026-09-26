"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
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
  BookOpen,
  Sun,
  Moon,
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
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link href={homeLink} className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform shrink-0">
              <Activity strokeWidth={1.75} size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Class<span className="text-indigo-600 dark:text-indigo-400">Pulse</span>
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                Academic Collaboration Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Center/Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden md:flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun strokeWidth={1.75} size={18} className="text-amber-400" />
            ) : (
              <Moon strokeWidth={1.75} size={18} className="text-slate-600" />
            )}
          </button>

          {isLoading ? (
            <div className="h-8 sm:h-9 w-20 sm:w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
          ) : currentUser ? (
            <>
              {/* Dual Action Buttons: Both Create Class and Join Class */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {onCreateClassOpen && (
                  <button
                    onClick={onCreateClassOpen}
                    className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-purple-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-all active:scale-95 shrink-0 min-h-[36px]"
                    title="Create a new course as Teacher"
                  >
                    <Plus strokeWidth={1.75} size={16} />
                    <span className="hidden sm:inline">Create Class</span>
                    <span className="sm:hidden text-[11px]">Create</span>
                  </button>
                )}

                {onJoinClassOpen && (
                  <button
                    onClick={onJoinClassOpen}
                    className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95 shrink-0 min-h-[36px]"
                    title="Join an existing course via class code"
                  >
                    <LogIn strokeWidth={1.75} size={16} />
                    <span className="hidden sm:inline">Join Class</span>
                    <span className="sm:hidden text-[11px]">Join</span>
                  </button>
                )}

                <Link
                  href="/analytics"
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0 min-h-[36px]"
                  title="View Analytics & Performance Dashboard"
                >
                  <BarChart3 strokeWidth={1.75} size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden md:inline">Analytics</span>
                </Link>
              </div>

              {/* Profile Avatar Dropdown Button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 p-1 sm:px-2.5 sm:py-1.5 text-left shadow-sm hover:bg-slate-100 dark:hover:bg-slate-750 transition-all active:scale-95 focus:outline-none min-h-[36px]"
                  aria-expanded={dropdownOpen}
                >
                  <div className="relative">
                    {(currentUser.avatarUrl || currentUser.avatar) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatarUrl || currentUser.avatar || ""}
                        alt={currentUser.name}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                      />
                    ) : (
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-sm">
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
                    <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-100">
                      {/* User Header */}
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[170px]">
                            {currentUser.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              activeRoleBadge.includes("Teacher") && activeRoleBadge.includes("Student")
                                ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                : activeRoleBadge.includes("Teacher")
                                ? "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            {activeRoleBadge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>

                      {/* Quick Dashboard Toggles */}
                      <div className="py-1 border-b border-slate-100 dark:border-slate-800 space-y-0.5">
                        <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Workspace Navigation
                        </div>

                        <Link
                          href="/dashboard?view=teaching"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-900 dark:hover:text-purple-200 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck strokeWidth={1.75} size={16} className="text-purple-600 dark:text-purple-400" />
                            <span>Teaching Dashboard</span>
                          </div>
                          <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            {userSummary?.teachingCount || 0}
                          </span>
                        </Link>

                        <Link
                          href="/dashboard?view=enrolled"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-900 dark:hover:text-emerald-200 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap strokeWidth={1.75} size={16} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Student Dashboard</span>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            {userSummary?.enrolledCount || 0}
                          </span>
                        </Link>

                        <Link
                          href="/dashboard/student/locker"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal-900 dark:hover:text-teal-200 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen strokeWidth={1.75} size={16} className="text-teal-600 dark:text-teal-400" />
                            <span>Academic Locker</span>
                          </div>
                          <span className="text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                            Notes & AI
                          </span>
                        </Link>

                        <Link
                          href="/analytics"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-900 dark:hover:text-indigo-200 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BarChart3 strokeWidth={1.75} size={16} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Analytics & Graphs</span>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            Charts
                          </span>
                        </Link>
                      </div>

                      {/* Theme Toggle (Visible on mobile/dropdown) */}
                      <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {theme === "dark" ? (
                              <Sun strokeWidth={1.75} size={16} className="text-amber-400" />
                            ) : (
                              <Moon strokeWidth={1.75} size={16} className="text-slate-500" />
                            )}
                            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Toggle
                          </span>
                        </button>
                      </div>

                      {/* Profile & Account Settings */}
                      <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors"
                        >
                          <UserIcon strokeWidth={1.75} size={16} className="text-slate-400" />
                          <span>Profile & Academic Details</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                        >
                          <LogOut strokeWidth={1.75} size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Unauthenticated visitors */
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun strokeWidth={1.75} size={16} className="text-amber-400" />
                ) : (
                  <Moon strokeWidth={1.75} size={16} className="text-slate-600" />
                )}
              </button>
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm min-h-[36px] flex items-center"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors min-h-[36px] flex items-center"
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
