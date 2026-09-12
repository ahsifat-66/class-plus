"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  Activity,
  GraduationCap,
  BookOpen,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  UserPlus,
  LogIn,
  PlusCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { allUsers, switchUser, currentUser, refreshUser } = useUser();

  // New account form
  const [activeTab, setActiveTab] = useState<"quick" | "register">("quick");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"TEACHER" | "STUDENT">("STUDENT");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const teachers = allUsers.filter((u) => u.role === "TEACHER");
  const students = allUsers.filter((u) => u.role === "STUDENT");

  const handleLoginAs = async (email: string) => {
    try {
      setIsSubmitting(true);
      setError("");
      await switchUser(email);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setError("Please fill in both your name and email.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register / sign in");
      }

      setSuccess(`Welcome, ${data.user.name}! Redirecting to dashboard...`);
      await refreshUser();
      setTimeout(() => {
        router.push("/");
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick helper to seed a fresh student in 1-click if needed
  const handleQuickCreateStudent = async (name: string, email: string) => {
    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role: "STUDENT",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await switchUser(data.user.email);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create student.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Class<span className="text-indigo-600">Pulse</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Teacher & Student Login Hub
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Clean Slate Mode • Choose or Create Your Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In as Teacher or Student
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              All previous classes and sample students have been wiped. Log in with an existing account or register your own credentials below.
            </p>

            {/* Tabs */}
            <div className="pt-2 flex justify-center">
              <div className="inline-flex rounded-2xl bg-slate-200/70 p-1 border border-slate-300/60">
                <button
                  type="button"
                  onClick={() => setActiveTab("quick")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "quick"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Choose Existing Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "register"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Create / Register New Account</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-md mx-auto rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-center font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="max-w-md mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 text-center font-medium">
              {success}
            </div>
          )}

          {/* TAB 1: QUICK PORTAL */}
          {activeTab === "quick" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
              {/* TEACHER PORTAL */}
              <div className="rounded-3xl border-2 border-purple-200 bg-white p-6 shadow-lg shadow-purple-100/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold px-3 py-1">
                      Teacher Portal
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Faculty & Educators
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Create classrooms, generate class codes, draft announcements with the AI Copilot, and grade student submissions.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Teacher Accounts
                    </span>

                    {teachers.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        No teachers found. Click "Create New Account" above to register as a Teacher.
                      </div>
                    ) : (
                      teachers.map((teacher) => {
                        const isActive = currentUser?.id === teacher.id;

                        return (
                          <button
                            key={teacher.id}
                            disabled={isSubmitting}
                            onClick={() => handleLoginAs(teacher.email)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                              isActive
                                ? "border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20"
                                : "border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={teacher.avatar || ""}
                                alt={teacher.name}
                                className="h-9 w-9 rounded-full object-cover ring-2 ring-purple-200 shrink-0"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">
                                  {teacher.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {teacher.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </span>
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm hover:bg-purple-700">
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Ready to create new courses from a completely clean slate.
                </div>
              </div>

              {/* STUDENT PORTAL */}
              <div className="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-lg shadow-emerald-100/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1">
                      Student Portal
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Enrolled Students
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Join classrooms via code, view assignments, chat in real-time channels, and ask questions to the Socratic AI Tutor.
                  </p>

                  <div className="mt-5 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Student Accounts
                    </span>

                    {students.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-3">
                        <p className="text-xs text-emerald-900 font-medium">
                          All sample students were deleted! You can create your own account or click below for instant 1-click setup:
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleQuickCreateStudent(
                                "MD Abid Hasan",
                                "abid@classpulse.edu"
                              )
                            }
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Quick Add Student: Abid</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewRole("STUDENT");
                              setActiveTab("register");
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-emerald-300 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition-all"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Custom Name Student</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      students.map((student) => {
                        const isActive = currentUser?.id === student.id;

                        return (
                          <button
                            key={student.id}
                            disabled={isSubmitting}
                            onClick={() => handleLoginAs(student.email)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                              isActive
                                ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20"
                                : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={student.avatar || ""}
                                alt={student.name}
                                className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-200 shrink-0"
                              />
                              <div>
                                <div className="text-xs font-bold text-slate-900">
                                  {student.name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </span>
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700">
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Ready to enroll with 6-character class codes.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER / CREATE NEW ACCOUNT */}
          {activeTab === "register" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm max-w-lg mx-auto animate-in fade-in duration-150">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Register a New Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create any teacher or student persona with zero passwords required
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Role selection radio pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewRole("TEACHER")}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                        newRole === "TEACHER"
                          ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-purple-600" />
                      <span>Teacher 🎓</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewRole("STUDENT")}
                      className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                        newRole === "STUDENT"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 text-emerald-600" />
                      <span>Student 🎒</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder={
                      newRole === "TEACHER"
                        ? "e.g. Prof. Alan Turing"
                        : "e.g. Alex Morgan"
                    }
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder={
                      newRole === "TEACHER"
                        ? "teacher@university.edu"
                        : "student@university.edu"
                    }
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating Account..." : `Sign In as ${newRole === "TEACHER" ? "Teacher" : "Student"}`}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        ClassPulse • Teacher & Student Collaboration Hub
      </footer>
    </div>
  );
}
