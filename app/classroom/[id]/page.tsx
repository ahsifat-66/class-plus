"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import AiAnnouncementModal from "@/components/AiAnnouncementModal";
import SocraticTutorDrawer from "@/components/SocraticTutorDrawer";
import CreateAssignmentModal from "@/components/CreateAssignmentModal";
import AssignmentSubmitModal from "@/components/AssignmentSubmitModal";
import TeacherGradingModal from "@/components/TeacherGradingModal";
import MarkdownViewer from "@/components/MarkdownViewer";
import {
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Megaphone,
  BookOpen,
  Hash,
  Users,
  Send,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus,
  Bot,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { formatDate, formatRelativeDueDate } from "@/lib/utils";

interface ClassroomData {
  id: string;
  name: string;
  subject: string;
  code: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  enrollments: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: string;
    };
    createdAt: string;
  }>;
  channels: Array<{
    id: string;
    name: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
    submissions: Array<{
      id: string;
      content: string;
      grade: number | null;
      feedback: string | null;
      submittedAt: string;
      studentId: string;
      student: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
      };
    }>;
  }>;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

export default function ClassroomHub() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const initialTab = searchParams.get("tab") || "stream";

  const { currentUser } = useUser();

  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [activeTab, setActiveTab] = useState<"stream" | "classwork" | "channels" | "people">(
    (initialTab as any) || "stream"
  );
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<any | null>(null);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchClassroom = useCallback(async () => {
    if (!classroomId) return;
    try {
      const res = await fetch(`/api/classrooms/${classroomId}`);
      if (res.ok) {
        const data = await res.json();
        setClassroom(data.classroom);
        if (data.classroom?.channels?.length > 0 && !activeChannelId) {
          setActiveChannelId(data.classroom.channels[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch classroom", e);
    }
  }, [classroomId, activeChannelId]);

  useEffect(() => {
    fetchClassroom();
  }, [fetchClassroom]);

  // Channel polling
  const fetchMessages = useCallback(async () => {
    if (!activeChannelId) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChannelMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  }, [activeChannelId]);

  useEffect(() => {
    if (activeTab === "channels" && activeChannelId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeChannelId, fetchMessages]);

  useEffect(() => {
    if (activeTab === "channels") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [channelMessages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannelId || !currentUser) return;

    const optimisticMsg: Message = {
      id: "optimistic-" + Date.now(),
      content: newMessage.trim(),
      senderId: currentUser.id,
      channelId: activeChannelId,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    };

    setChannelMessages((prev) => [...prev, optimisticMsg]);
    const messageToSend = newMessage.trim();
    setNewMessage("");

    try {
      setIsSendingMessage(true);
      const res = await fetch(`/api/channels/${activeChannelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageToSend,
          senderId: currentUser.id,
        }),
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const copyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isTeacher = currentUser?.role === "TEACHER";

  if (!classroom) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
            <span className="h-4 w-4 rounded-full bg-indigo-600 animate-ping" />
            <span>Loading Classroom Hub...</span>
          </div>
        </div>
      </div>
    );
  }

  const activeChannel = classroom.channels.find((c) => c.id === activeChannelId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Class Code:</span>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1 text-xs font-mono font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
              title="Copy join code for students"
            >
              <span>{classroom.code}</span>
              {copiedCode ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-indigo-400" />
              )}
            </button>
          </div>
        </div>

        {/* Classroom Banner Header */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <BookOpen className="h-3 w-3" />
                {classroom.subject}
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
                {classroom.name}
              </h1>
              <div className="mt-3 flex items-center gap-3 text-xs text-indigo-200">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={classroom.teacher.avatar || ""}
                    alt={classroom.teacher.name}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-white/50"
                  />
                  <span>Instructor: <strong>{classroom.teacher.name}</strong></span>
                </div>
                <span>•</span>
                <span>{classroom.enrollments.length} Enrolled Students</span>
                <span>•</span>
                <span>{classroom.channels.length} Channels</span>
              </div>
            </div>

            {/* Quick action: Teacher AI Copilot or Student Socratic Help */}
            {isTeacher && (
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all"
              >
                <Sparkles className="h-4 w-4 text-slate-900" />
                <span>Draft with AI Copilot</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stream")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "stream"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Stream</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.announcements.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("classwork")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "classwork"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Classwork</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.assignments.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "channels"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Hash className="h-4 w-4" />
            <span>Discussion Channels</span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "people"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>People & Roster</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.enrollments.length + 1})
            </span>
          </button>
        </div>

        {/* TAB CONTENT */}

        {/* 1. STREAM TAB */}
        {activeTab === "stream" && (
          <div className="space-y-6">
            {/* Teacher Fast Announce Box */}
            {isTeacher && (
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUser?.avatar || ""}
                      alt={currentUser?.name || ""}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Share an update with your class
                      </h3>
                      <p className="text-xs text-slate-500">
                        Use the AI Copilot to generate structured FAQs, or draft a quick bulletin.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>Draft with AI Copilot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Announcements Stream */}
            <div className="space-y-4">
              {classroom.announcements.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                  <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-3 text-sm font-bold text-slate-900">
                    No announcements published yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Updates, lecture notes, and reminders will show up here.
                  </p>
                </div>
              ) : (
                classroom.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.author.avatar || ""}
                          alt={item.author.name}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.author.name}
                            </span>
                            <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-bold">
                              Instructor
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 mb-2">
                        {item.title}
                      </h4>
                      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                        <MarkdownViewer content={item.content} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. CLASSWORK TAB */}
        {activeTab === "classwork" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assignments & Labs</h3>
                <p className="text-xs text-slate-500">
                  Track requirements, due dates, submit deliverables, and inspect grades.
                </p>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Assignment</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {classroom.assignments.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                  <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    No assignments posted yet
                  </h4>
                </div>
              ) : (
                classroom.assignments.map((assignment) => {
                  const mySubmission = assignment.submissions.find(
                    (s) => s.studentId === currentUser?.id
                  );
                  const isSubmitted = !!mySubmission;
                  const isGraded = mySubmission && mySubmission.grade !== null;

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[11px] font-bold">
                              {assignment.maxPoints} Points
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeDueDate(assignment.dueDate)}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {assignment.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Deadline: {formatDate(assignment.dueDate)}
                          </span>
                        </div>

                        {/* Status / Action Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isTeacher ? (
                            <button
                              onClick={() => setSelectedAssignmentForGrading(assignment)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <Award className="h-4 w-4" />
                              <span>
                                Grade Submissions ({assignment.submissions.length})
                              </span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-3">
                              {isGraded ? (
                                <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                  <Award className="h-4 w-4 text-emerald-600" />
                                  Grade: {mySubmission.grade}/{assignment.maxPoints}
                                </span>
                              ) : isSubmitted ? (
                                <span className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-200">
                                  <FileCheck className="h-4 w-4" />
                                  Turned In
                                </span>
                              ) : null}

                              <button
                                onClick={() => setSelectedAssignmentForSubmit(assignment)}
                                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all ${
                                  isSubmitted
                                    ? "bg-slate-800 hover:bg-slate-900"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                              >
                                <span>{isSubmitted ? "View / Edit Solution" : "Submit Solution"}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-200/60">
                        {assignment.description}
                      </div>

                      {/* If Student & Graded: Show teacher feedback preview */}
                      {!isTeacher && isGraded && mySubmission.feedback && (
                        <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-950">
                          <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Instructor Feedback:
                          </span>
                          <p>{mySubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 3. CHANNELS TAB */}
        {activeTab === "channels" && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[560px]">
            {/* Left Channel Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/70 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Class Channels
                </span>
                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Live Polling
                </span>
              </div>

              <div className="space-y-1">
                {classroom.channels.map((channel) => {
                  const isActive = channel.id === activeChannelId;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannelId(channel.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Hash
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200/80 px-2">
                <p className="text-[11px] text-slate-400 leading-normal">
                  Real-time discussion stream. Automatically refreshes every 3 seconds.
                </p>
              </div>
            </div>

            {/* Right Chat Stream */}
            <div className="flex-1 flex flex-col justify-between bg-white">
              {/* Channel Header */}
              <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-indigo-600" />
                  <span className="font-bold text-slate-900 text-sm">
                    {activeChannel?.name || "channel"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {channelMessages.length} messages
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[460px]">
                {channelMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Hash className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">
                      This channel is quiet right now. Start the conversation!
                    </p>
                  </div>
                ) : (
                  channelMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isSenderTeacher = msg.sender?.role === "TEACHER";

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.sender?.avatar || ""}
                          alt={msg.sender?.name || ""}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 mt-1"
                        />

                        <div
                          className={`flex flex-col max-w-[80%] ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-slate-900">
                              {msg.sender?.name}
                            </span>
                            {isSenderTeacher && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                                Instructor
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-slate-100 border border-slate-200/80 text-slate-800 rounded-tl-none"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message #${activeChannel?.name || "channel"}...`}
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || isSendingMessage}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. PEOPLE TAB */}
        {activeTab === "people" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-8">
            {/* Teacher Section */}
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Course Instructor
                </h3>
              </div>
              <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={classroom.teacher.avatar || ""}
                    alt={classroom.teacher.name}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-purple-500/20"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {classroom.teacher.name}
                    </h4>
                    <p className="text-xs text-slate-500">{classroom.teacher.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 border border-purple-200">
                  Lead Teacher
                </span>
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Enrolled Students ({classroom.enrollments.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Join Code: {classroom.code}
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {classroom.enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="flex items-center justify-between py-3.5 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enr.user.avatar || ""}
                        alt={enr.user.name}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {enr.user.name}
                          </span>
                          {enr.user.id === currentUser?.id && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{enr.user.email}</p>
                      </div>
                    </div>

                    <span className="text-xs text-slate-400">
                      Joined {formatDate(enr.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Socratic AI Tutor Floating Drawer */}
      <SocraticTutorDrawer
        classroomName={classroom.name}
        subject={classroom.subject}
      />

      {/* AI Announcement Copilot Modal */}
      <AiAnnouncementModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        classroomId={classroom.id}
        classNameTitle={classroom.name}
        onAnnouncementPosted={fetchClassroom}
      />

      {/* Create Assignment Modal (Teacher) */}
      <CreateAssignmentModal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        classroomId={classroom.id}
        onAssignmentCreated={fetchClassroom}
      />

      {/* Submit Assignment Modal (Student) */}
      <AssignmentSubmitModal
        isOpen={!!selectedAssignmentForSubmit}
        onClose={() => setSelectedAssignmentForSubmit(null)}
        assignment={selectedAssignmentForSubmit}
        onSubmitted={fetchClassroom}
      />

      {/* Grade Submissions Modal (Teacher) */}
      <TeacherGradingModal
        isOpen={!!selectedAssignmentForGrading}
        onClose={() => setSelectedAssignmentForGrading(null)}
        assignment={selectedAssignmentForGrading}
        onGraded={fetchClassroom}
      />
    </div>
  );
}
