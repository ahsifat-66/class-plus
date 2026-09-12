"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import CreateClassModal from "@/components/CreateClassModal";
import JoinClassModal from "@/components/JoinClassModal";
import {
  BookOpen,
  Users,
  Copy,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  LogIn,
  Sparkles,
  AlertCircle,
  FileCheck,
  Hash,
  Award,
} from "lucide-react";
import { formatRelativeDueDate } from "@/lib/utils";

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

export default function Dashboard() {
  const { currentUser, isLoading: isUserLoading } = useUser();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

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

  const isTeacher = currentUser?.role === "TEACHER";

  // Aggregate student "Due Soon" tasks
  const dueSoonTasks = !isTeacher
    ? classrooms
        .flatMap((c) =>
          c.assignments.map((a) => {
            const mySubmission = a.submissions?.find(
              (s) => s.studentId === currentUser?.id
            );
            return {
              ...a,
              classroomId: c.id,
              classroomName: c.name,
              submission: mySubmission,
            };
          })
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
    : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onCreateClassOpen={() => setIsCreateOpen(true)}
        onJoinClassOpen={() => setIsJoinOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>
                  {isTeacher
                    ? "Teacher Workspace & Copilot Station"
                    : "Student Action Center & Socratic Hub"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {currentUser?.name || "Educator"}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                {isTeacher
                  ? "Manage courses, draft announcements in seconds with the AI Copilot, grade student submissions, and connect in real-time discussion channels."
                  : "Track upcoming assignment deadlines, access course announcements, engage in discussions, and get hints from the Socratic AI Tutor."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isTeacher ? (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Classroom</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsJoinOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Join Classroom</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student "Action Center / Due Soon" Widget */}
        {!isTeacher && dueSoonTasks.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Action Center • Due Soon
                  </h2>
                  <p className="text-xs text-slate-500">
                    Priority deadlines across all your enrolled classrooms
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {dueSoonTasks.length} assignment{dueSoonTasks.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dueSoonTasks.map((task) => {
                const isSubmitted = !!task.submission;
                const isGraded =
                  task.submission && task.submission.grade !== null;

                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {task.classroomName}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                          {formatRelativeDueDate(task.dueDate)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <div>
                        {isGraded ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" />
                            {task.submission?.grade}/{task.maxPoints} pts
                          </span>
                        ) : isSubmitted ? (
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                            <FileCheck className="h-3.5 w-3.5" />
                            Turned In
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Pending • {task.maxPoints} pts
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/classroom/${task.classroomId}?tab=classwork`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-0.5 transition-all"
                      >
                        <span>{isSubmitted ? "Review" : "Submit"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Classrooms Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {isTeacher ? "Your Active Classrooms" : "Enrolled Classrooms"}
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
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-slate-900">
                {isTeacher ? "No classrooms yet" : "Not enrolled in any classrooms"}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                {isTeacher
                  ? "Click the button below to launch your first collaborative classroom with auto-provisioned channels."
                  : "Enter a 6-character code provided by your teacher (try DBMS45) to join a class."}
              </p>
              <div className="mt-6">
                {isTeacher ? (
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Classroom</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsJoinOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Join with Class Code</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
                >
                  <div>
                    {/* Top row: Subject & Join Code */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full truncate max-w-[170px]">
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
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {cls.name}
                      </h3>
                    </Link>

                    {/* Teacher / Roster Info */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cls.teacher?.avatar || ""}
                        alt={cls.teacher?.name}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="font-medium text-slate-700 truncate">
                        {cls.teacher?.name}
                      </span>
                    </div>

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

                  {/* Bottom Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {cls.announcements?.length || 0} announcement
                      {(cls.announcements?.length || 0) === 1 ? "" : "s"}
                    </span>
                    <Link
                      href={`/classroom/${cls.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <span>Enter Class</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={fetchClassrooms}
      />
      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={fetchClassrooms}
      />
    </div>
  );
}
