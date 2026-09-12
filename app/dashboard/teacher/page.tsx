"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import CreateClassModal from "@/components/CreateClassModal";
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
} from "lucide-react";

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
    dueDate: string;
    maxPoints: number;
  }>;
  channels: Array<{ id: string; name: string }>;
  announcements: Array<{ id: string; title: string }>;
}

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const { currentUser, isLoading: isUserLoading } = useUser();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoadingClasses(true);
      const res = await fetch(`/api/classrooms?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setClassrooms(data.classrooms || []);
      }
    } catch (e) {
      console.error("Failed to load classrooms", e);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchClassrooms();
    }
  }, [currentUser, fetchClassrooms]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalStudents = classrooms.reduce(
    (acc, c) => acc + (c.enrollments?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onCreateClassOpen={() => setIsCreateOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Authorization Error Banner if redirected from unauthorized route */}
        {errorParam && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 text-xs sm:text-sm text-amber-900 shadow-sm animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Role-Based Access Notice: </span>
              {errorParam}
            </div>
          </div>
        )}

        {/* Teacher Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-md border border-purple-400/20">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-300" />
                <span>Faculty & Instructor Portal • Authorized TEACHER</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {currentUser?.name || "Professor"}
              </h1>
              <p className="text-sm text-purple-200 max-w-2xl leading-relaxed">
                Manage your classrooms, draft announcements using the Gemini-powered AI Copilot, grade student deliverables, and guide real-time discussion channels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Classroom</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <span className="text-xs text-purple-300 block">Classrooms</span>
              <span className="text-xl font-bold text-white">{classrooms.length}</span>
            </div>
            <div>
              <span className="text-xs text-purple-300 block">Total Students</span>
              <span className="text-xl font-bold text-white">{totalStudents}</span>
            </div>
            <div>
              <span className="text-xs text-purple-300 block">Active Status</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1">
                Verified Faculty
              </span>
            </div>
          </div>
        </div>

        {/* Classrooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Your Teaching Courses
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {classrooms.length} Class{classrooms.length === 1 ? "" : "es"}
            </span>
          </div>

          {isLoadingClasses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 rounded-3xl border border-slate-200 bg-white p-6 animate-pulse"
                />
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="text-base font-bold text-slate-900">
                You haven't created any classrooms yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first classroom. It will be provisioned with default discussion channels and an auto-generated join code for students.
              </p>
              <div>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Classroom</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full truncate max-w-[170px]">
                        {cls.subject}
                      </span>

                      {/* Code Badge with Copy button */}
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

                    {/* Quick Stats Pills */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cls.enrollments?.length || 0} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cls.channels?.length || 0} channels</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>{cls.assignments?.length || 0} tasks</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {cls.announcements?.length || 0} announcement
                      {(cls.announcements?.length || 0) === 1 ? "" : "s"}
                    </span>
                    <Link
                      href={`/classroom/${cls.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 text-purple-800 px-3.5 py-1.5 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all"
                    >
                      <span>Manage Class</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={fetchClassrooms}
      />
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-xs text-slate-400">Loading Faculty Portal...</div>
        </div>
      }
    >
      <TeacherDashboardContent />
    </Suspense>
  );
}
