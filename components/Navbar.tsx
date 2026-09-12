"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  GraduationCap,
  UserCheck,
  Plus,
  LogIn,
  ChevronDown,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface NavbarProps {
  onCreateClassOpen?: () => void;
  onJoinClassOpen?: () => void;
}

export default function Navbar({
  onCreateClassOpen,
  onJoinClassOpen,
}: NavbarProps) {
  const { currentUser, allUsers, switchUser, isLoading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isTeacher = currentUser?.role === "TEACHER";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
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
          {/* Quick Action Button */}
          {currentUser && (
            <div>
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
            </div>
          )}

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left text-xs sm:text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all"
            >
              <div className="relative">
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-indigo-500/20"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || "??"}
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
                  {currentUser?.name || (isLoading ? "Loading..." : "Guest")}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isTeacher ? "text-purple-600" : "text-emerald-600"
                  }`}
                >
                  {currentUser?.role || "USER"}
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Switch Demo Persona
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Toggle roles instantly to test both Teacher & Student views
                    </p>
                  </div>

                  <div className="mt-1 space-y-1">
                    {allUsers.map((user) => {
                      const isActive = user.id === currentUser?.id;
                      const isTeacherUser = user.role === "TEACHER";

                      return (
                        <button
                          key={user.id}
                          onClick={async () => {
                            setDropdownOpen(false);
                            if (!isActive) {
                              await switchUser(user.email);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            isActive
                              ? "bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-medium"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={user.avatar || ""}
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {user.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isTeacherUser
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {user.role}
                            </span>
                            {isActive && (
                              <UserCheck className="h-4 w-4 text-indigo-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 px-2 py-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Sandbox Mode
                    </span>
                    <Link
                      href="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Full Login Portal →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Explicit Login / Switch Portal Button */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <LogIn className="h-3.5 w-3.5 text-indigo-600" />
            <span>Login Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
