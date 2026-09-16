"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  Plus,
  LogIn,
  LogOut,
} from "lucide-react";

interface NavbarProps {
  onCreateClassOpen?: () => void;
  onJoinClassOpen?: () => void;
}

export default function Navbar({
  onCreateClassOpen,
  onJoinClassOpen,
}: NavbarProps) {
  const { currentUser, isLoading } = useUser();

  const isTeacher = currentUser?.role === "TEACHER";
  const homeLink = currentUser
    ? isTeacher
      ? "/dashboard/teacher"
      : "/dashboard/student"
    : "/";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
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
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-xl" />
          ) : currentUser ? (
            <>
              {/* Quick Action Button */}
              {isTeacher ? (
                onCreateClassOpen && (
                  <button
                    onClick={onCreateClassOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Class</span>
                  </button>
                )
              ) : (
                onJoinClassOpen && (
                  <button
                    onClick={onJoinClassOpen}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Join Class</span>
                  </button>
                )
              )}

              {/* User Profile Badge */}
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left text-xs sm:text-sm font-medium text-slate-800 shadow-sm">
                <div className="relative">
                  {currentUser.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                      {currentUser.name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      isTeacher ? "bg-purple-500" : "bg-emerald-500"
                    }`}
                  />
                </div>

                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="font-semibold text-slate-900 truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isTeacher ? "text-purple-600" : "text-emerald-600"
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Clean Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm active:scale-95"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
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
