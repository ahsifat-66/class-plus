"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import AiAnnouncementModal from "@/components/AiAnnouncementModal";
import SocraticTutorDrawer from "@/components/SocraticTutorDrawer";
import CreateAssignmentModal from "@/components/CreateAssignmentModal";
import EditAssignmentModal from "@/components/EditAssignmentModal";
import AssignmentSubmitModal from "@/components/AssignmentSubmitModal";
import TeacherGradingModal from "@/components/TeacherGradingModal";
import DeleteClassroomModal from "@/components/DeleteClassroomModal";
import RemoveStudentModal from "@/components/RemoveStudentModal";
import ClassroomNoteBox, { NoteItem } from "@/components/ClassroomNoteBox";
import MarkdownViewer from "@/components/MarkdownViewer";
import CreateQuizModal from "@/components/CreateQuizModal";
import QuizTakingModal from "@/components/QuizTakingModal";
import QuizSubmissionsModal from "@/components/QuizSubmissionsModal";
import EditAnnouncementModal from "@/components/EditAnnouncementModal";
import LeaveClassroomModal from "@/components/LeaveClassroomModal";
import EditClassModal from "@/components/EditClassModal";
import AssignBooksModal from "@/components/AssignBooksModal";
import PdfReaderModal from "@/components/PdfReaderModal";
import { useLanguage } from "@/lib/i18n";
import {
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Megaphone,
  BookOpen,
  BookMarked,
  Hash,
  Users,
  Send,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Plus,
  Bot,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Video,
  ExternalLink,
  Trash2,
  Edit3,
  MoreVertical,
  Lock,
  Settings,
  UserMinus,
  FileText,
  HelpCircle,
  Download,
  LogOut,
  Pencil,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { booksData } from "@/data/booksData";
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
    postPermission?: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    isEdited?: boolean;
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
    assignToAll?: boolean;
    assignedStudentIds?: string[];
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
  notes?: NoteItem[];
  gradeLevel?: string | null;
  textbooks?: Array<{
    id: string;
    grade: string;
    subject: string;
    title: string;
    driveUrl?: string | null;
    coverImage?: string | null;
  }>;
  bookIds?: string[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  createdAt: string;
  isEdited?: boolean;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

export default function ClassroomHub() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const initialTab = searchParams.get("tab") || "stream";

  const { currentUser } = useUser();
  const { t, language } = useLanguage();

  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stream" | "classwork" | "quizzes" | "channels" | "bookshelf" | "notebox" | "people"
  >((initialTab as any) || "stream");
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [readingBook, setReadingBook] = useState<{
    title: string;
    driveUrl: string;
    grade?: string;
    subject?: string;
  } | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [channelMessages, setChannelMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [submissionToast, setSubmissionToast] = useState<string | null>(null);

  // Quizzes state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState<any | null>(null);
  const [selectedQuizSubmissions, setSelectedQuizSubmissions] = useState<any | null>(null);

  // Announcement edit/delete state
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [announcementMenuOpenId, setAnnouncementMenuOpenId] = useState<string | null>(null);

  // Leave classroom modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Gradebook export state
  const [isExportingGradebook, setIsExportingGradebook] = useState(false);

  // Modals & Menu State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<any | null>(null);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<any | null>(null);
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [bookshelfFilter, setBookshelfFilter] = useState("All");
  const [bookshelfSearch, setBookshelfSearch] = useState("");
  const [isDeletingBookId, setIsDeletingBookId] = useState<string | null>(null);
  const [isAssignBooksOpen, setIsAssignBooksOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchQuizzes = useCallback(async () => {
    if (!classroomId) return;
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/quizzes`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (e) {
      console.error("Failed to fetch quizzes", e);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to permanently delete this quiz?")) return;
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchQuizzes();
        setSubmissionToast("Quiz deleted successfully.");
        setTimeout(() => setSubmissionToast(null), 3000);
      }
    } catch (e) {
      console.error("Failed to delete quiz", e);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      const res = await fetch(
        `/api/classrooms/${classroomId}/announcements/${announcementId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchClassroom();
        setSubmissionToast("Announcement deleted successfully.");
        setTimeout(() => setSubmissionToast(null), 3000);
      }
    } catch (e) {
      console.error("Failed to delete announcement", e);
    }
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!classroomId || !isTeacher) return;
    const confirmMsg =
      language === "bn"
        ? `আপনি কি নিশ্চিত যে "${bookTitle}" বইটি এই ক্লাসের বুকশেলফ থেকে মুছে ফেলতে চান?`
        : `Are you sure you want to remove "${bookTitle}" from this classroom's bookshelf?`;
    if (!confirm(confirmMsg)) return;

    try {
      setIsDeletingBookId(bookId);
      const res = await fetch(`/api/classrooms/${classroomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeTextbookId: bookId }),
      });

      if (res.ok) {
        setClassroom((prev) =>
          prev
            ? {
                ...prev,
                bookIds: (prev.bookIds || []).filter((id) => id !== bookId),
                textbooks: (prev.textbooks || []).filter((b) => b.id !== bookId),
              }
            : prev
        );
        const successMsg =
          language === "bn"
            ? `"${bookTitle}" বইটি বুকশেলফ থেকে মুছে ফেলা হয়েছে।`
            : `"${bookTitle}" was removed from the bookshelf.`;
        setSubmissionToast(successMsg);
        setTimeout(() => setSubmissionToast(null), 3500);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove textbook.");
      }
    } catch (err) {
      console.error("Error removing textbook:", err);
      alert("Network error while removing textbook.");
    } finally {
      setIsDeletingBookId(null);
    }
  };

  const handleExportGradebook = async () => {
    if (!classroomId) return;
    try {
      setIsExportingGradebook(true);
      const res = await fetch(`/api/classrooms/${classroomId}/gradebook`);
      if (!res.ok) {
        throw new Error("Failed to export gradebook");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      let filename = `Gradebook_${classroom?.name || "Class"}.csv`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSubmissionToast("Gradebook CSV downloaded.");
      setTimeout(() => setSubmissionToast(null), 3000);
    } catch (err) {
      console.error("Gradebook export error:", err);
    } finally {
      setIsExportingGradebook(false);
    }
  };

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

  const enrolledStudents = useMemo(() => {
    return (classroom?.enrollments || []).map((e) => ({
      id: e.user.id,
      name: e.user.name,
      email: e.user.email,
      avatar: e.user.avatar,
    }));
  }, [classroom?.enrollments]);

  const isTeacher =
    currentUser?.role === "TEACHER" ||
    (!!classroom && !!currentUser && classroom.teacherId === currentUser.id);

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
      } else {
        const data = await res.json();
        setSubmissionToast(data.error || "Failed to send message");
        setTimeout(() => setSubmissionToast(null), 3000);
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateChannelPermission = async (
    channelId: string,
    permission: "EVERYONE" | "TEACHERS_ONLY"
  ) => {
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postPermission: permission }),
      });
      if (res.ok) {
        setClassroom((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            channels: prev.channels.map((ch) =>
              ch.id === channelId ? { ...ch, postPermission: permission } : ch
            ),
          };
        });
        setChannelSettingsOpen(false);
        setSubmissionToast(
          `Channel permission set to ${
            permission === "TEACHERS_ONLY" ? "Teachers Only" : "Everyone"
          }.`
        );
        setTimeout(() => setSubmissionToast(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update channel permission", err);
    }
  };

  const handleStartEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingMessageContent(msg.content);
  };

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editingMessageContent.trim() || !activeChannelId) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}/messages/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingMessageContent.trim() }),
      });
      if (res.ok) {
        setChannelMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, content: editingMessageContent.trim(), isEdited: true }
              : m
          )
        );
        setEditingMessageId(null);
        setEditingMessageContent("");
      }
    } catch (err) {
      console.error("Failed to edit message", err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    if (!activeChannelId) return;
    try {
      const res = await fetch(`/api/channels/${activeChannelId}/messages/${msgId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setChannelMessages((prev) => prev.filter((m) => m.id !== msgId));
      }
    } catch (err) {
      console.error("Failed to delete message", err);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this assignment?"))
      return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchClassroom();
        setSubmissionToast("Assignment deleted successfully.");
        setTimeout(() => setSubmissionToast(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete assignment", err);
    }
  };

  const copyCode = () => {
    if (!classroom?.code) return;
    navigator.clipboard.writeText(classroom.code);
    setCopiedCode(true);
    setSubmissionToast(`Course code "${classroom.code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
    setTimeout(() => setSubmissionToast(null), 3000);
  };

  const handleJoinLecture = () => {
    window.open("https://meet.google.com/new", "_blank", "noopener,noreferrer");
  };

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

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-6">
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <BookOpen className="h-3 w-3" />
                  {classroom.subject}
                </span>
                {classroom.gradeLevel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/40 border border-indigo-300/30 px-3 py-1 text-xs font-semibold backdrop-blur-md text-white">
                    {classroom.gradeLevel}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
                {classroom.name}
              </h1>
              <div className="mt-3 flex items-center gap-3 text-xs text-indigo-200 flex-wrap">
                <div className="flex items-center gap-2">
                  {classroom.teacher.avatar ? (
                    <img
                      src={classroom.teacher.avatar}
                      alt={classroom.teacher.name}
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-white/50 shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {classroom.teacher.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                  )}
                  <span>
                    Instructor: <strong>{classroom.teacher.name}</strong>
                  </span>
                </div>
                <span>•</span>
                <span>{classroom.enrollments.length} Enrolled Students</span>
                <span>•</span>
                <span>{classroom.channels.length} Channels</span>
              </div>
            </div>

            {/* Actions: Join Lecture, Copy Code, AI Copilot, and Delete Class (Teacher) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleJoinLecture}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all backdrop-blur-md active:scale-95 shadow-sm min-h-[44px]"
                title="Launch virtual lecture room"
              >
                <Video strokeWidth={1.75} size={18} />
                <span>Join Lecture</span>
                <ExternalLink strokeWidth={1.75} size={14} className="opacity-70" />
              </button>

              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white transition-all backdrop-blur-md active:scale-95 min-h-[44px]"
                title="Copy Course Code"
              >
                {copiedCode ? (
                  <>
                    <Check strokeWidth={1.75} size={16} className="text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy strokeWidth={1.75} size={16} />
                    <span>{classroom.code}</span>
                  </>
                )}
              </button>

              {isTeacher && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditClassOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all backdrop-blur-md active:scale-95 min-h-[44px]"
                    title="Edit Classroom Settings & NCTB Textbooks"
                  >
                    <Settings strokeWidth={1.75} size={16} />
                    <span>{t("editClass", "Edit Class")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportGradebook}
                    disabled={isExportingGradebook}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all backdrop-blur-md active:scale-95 min-h-[44px] disabled:opacity-50"
                    title="Export Class Gradebook (CSV)"
                  >
                    <Download strokeWidth={1.75} size={16} />
                    <span>{isExportingGradebook ? "Exporting..." : "Export Gradebook"}</span>
                  </button>

                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md active:scale-95 transition-all min-h-[44px]"
                  >
                    <Bot strokeWidth={1.75} size={18} />
                    <span>Draft with AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDeleteClassModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-rose-100 transition-all backdrop-blur-md active:scale-95 min-h-[44px]"
                    title="Delete Classroom"
                  >
                    <Trash2 strokeWidth={1.75} size={16} />
                    <span>Delete Class</span>
                  </button>
                </>
              )}

              {!isTeacher && (
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-400/30 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-rose-200 transition-all backdrop-blur-md active:scale-95 min-h-[44px]"
                  title="Leave this classroom"
                >
                  <LogOut strokeWidth={1.75} size={16} />
                  <span>Leave Class</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("stream")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "stream"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Megaphone className="h-4 w-4 shrink-0" />
            <span>{t("tabStream", "Stream")}</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.announcements.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("classwork")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "classwork"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>{t("tabClasswork", "Classwork")}</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.assignments.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quizzes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "quizzes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>{t("tabQuizzes", "Quizzes")}</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({quizzes.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bookshelf")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "bookshelf"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookMarked className="h-4 w-4 shrink-0" />
            <span>{t("tabBookShelf", "BookShelf")}</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.textbooks?.length || classroom.bookIds?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "channels"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Hash className="h-4 w-4 shrink-0" />
            <span>{t("tabChannels", "Discussion Channels")}</span>
            <span className="relative flex h-2 w-2 ml-0.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("notebox")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "notebox"
                ? "bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>{t("tabNoteBox", "NoteBox")}</span>
            <span className="ml-1 text-xs opacity-75 font-mono">
              ({classroom.notes?.length || 0})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "people"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>{t("tabPeople", "People")}</span>
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
                      <h4 className="text-sm font-bold text-slate-800">
                        Announce something to your class
                      </h4>
                      <p className="text-xs text-slate-500">
                        Publish course updates or generate structured syllabus announcements with AI.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <Bot strokeWidth={1.75} size={16} />
                    <span>Create Announcement</span>
                  </button>
                </div>
              </div>
            )}

            {/* Announcement Stream List */}
            <div className="space-y-4">
              {classroom.announcements.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Megaphone strokeWidth={1.75} size={24} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No announcements posted yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Instructor announcements and course updates will appear here on the stream timeline.
                  </p>
                </div>
              ) : (
                classroom.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.author.avatar || ""}
                          alt={item.author.name}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {item.author.name}
                            </span>
                            <span className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 text-[10px] font-bold">
                              Instructor
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{formatDate(item.createdAt)}</span>
                            {item.isEdited && (
                              <span className="text-[10px] italic text-indigo-500 font-medium">
                                (edited)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Instructor / Author Actions */}
                      {(isTeacher || item.author.id === currentUser?.id) && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setAnnouncementMenuOpenId(
                                announcementMenuOpenId === item.id ? null : item.id
                              )
                            }
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors"
                            title="Announcement actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {announcementMenuOpenId === item.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setAnnouncementMenuOpenId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-36 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAnnouncementMenuOpenId(null);
                                    setEditingAnnouncement(item);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                  <Pencil size={14} className="text-slate-500 dark:text-slate-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAnnouncementMenuOpenId(null);
                                    handleDeleteAnnouncement(item.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                >
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
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
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3 shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 strokeWidth={1.75} size={24} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    All coursework completed. No pending assignments.
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    New deliverables, lab exercises, and projects will appear here once published by faculty.
                  </p>
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[11px] font-bold">
                              {assignment.maxPoints} Points
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeDueDate(assignment.dueDate)}
                            </span>
                            {/* Targeted Audience Badge */}
                            {assignment.assignToAll ? (
                              <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold border border-slate-200">
                                All Students
                              </span>
                            ) : (
                              <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-semibold border border-indigo-200">
                                {assignment.assignedStudentIds?.length || 0} Targeted Students
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {assignment.title}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Deadline: {formatDate(assignment.dueDate)}
                          </span>
                        </div>

                        {/* Status / Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isTeacher ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedAssignmentForGrading(assignment)}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                <Award className="h-4 w-4" />
                                <span>Grade ({assignment.submissions.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAssignment(assignment)}
                                className="inline-flex items-center gap-1 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors"
                                title="Edit Assignment"
                              >
                                <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className="inline-flex items-center justify-center rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 p-2 text-rose-600 transition-colors"
                                title="Delete Assignment"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              </button>
                            </div>
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

        {/* QUIZZES TAB */}
        {activeTab === "quizzes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Auto-Graded Quizzes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Timed assessments with instant automated evaluation and academic reviews.
                </p>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setIsCreateQuizOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Quiz</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3 shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <HelpCircle strokeWidth={1.75} size={24} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    No quizzes published yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {isTeacher
                      ? "Create your first quiz with custom questions or generate curriculum-aligned MCQs using Gemini AI."
                      : "Quizzes published by your instructor will appear here."}
                  </p>
                </div>
              ) : (
                quizzes.map((quiz) => {
                  const mySub = quiz.mySubmission;
                  const isSubmitted = !!mySub;
                  const totalPts =
                    quiz.questions?.reduce(
                      (sum: number, q: any) => sum + (q.points || 1),
                      0
                    ) || 0;

                  return (
                    <div
                      key={quiz.id}
                      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:border-indigo-200 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[11px] font-bold">
                              {quiz.questions?.length || 0} Questions • {totalPts} Pts
                            </span>
                            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1">
                              <Clock size={12} />
                              <span>{quiz.timeLimitMinutes} min limit</span>
                            </span>
                            {quiz.dueDate && (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Due: {formatDate(quiz.dueDate)}</span>
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={12} />
                                <span>
                                  Score: {mySub.score}/{mySub.totalPoints} (
                                  {Math.round((mySub.score / mySub.totalPoints) * 100)}
                                  %)
                                </span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            {quiz.title}
                          </h4>
                          {quiz.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isTeacher ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedQuizSubmissions(quiz)}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                              >
                                <Award className="h-4 w-4" />
                                <span>Submissions ({quiz.submissionsCount || 0})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                className="inline-flex items-center justify-center rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 p-2 text-rose-600 dark:text-rose-400 transition-colors"
                                title="Delete Quiz"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setTakingQuiz(quiz)}
                              className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                                isSubmitted
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none"
                              }`}
                            >
                              <HelpCircle className="h-4 w-4" />
                              <span>{isSubmitted ? "Review Results" : "Start Quiz"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* BOOKSHELF TAB (NCTB Textbooks) */}
        {activeTab === "bookshelf" && (() => {
          const effectiveTextbooks =
            classroom?.textbooks && classroom.textbooks.length > 0
              ? classroom.textbooks
              : classroom?.bookIds && classroom.bookIds.length > 0
              ? booksData.filter((b) => classroom.bookIds!.includes(b.id))
              : [];

          const uniqueSubjects = [
            "All",
            ...Array.from(
              new Set(
                effectiveTextbooks
                  .map((b: any) => b.subject)
                  .filter(Boolean)
              )
            ),
          ];

          const filteredBooks = effectiveTextbooks.filter((b: any) => {
            const matchesSubj =
              bookshelfFilter === "All" ||
              b.subject?.toLowerCase() === bookshelfFilter.toLowerCase();
            const q = bookshelfSearch.toLowerCase().trim();
            const matchesSearch =
              !q ||
              b.title?.toLowerCase().includes(q) ||
              b.subject?.toLowerCase().includes(q);
            return matchesSubj && matchesSearch;
          });

          return (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BookMarked strokeWidth={1.75} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                        {t("bookshelfTitle", "NCTB Curriculum Textbooks")}
                      </h3>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {language === "bn" ? "পাঠ্যবই তালিকা" : "Assigned Textbooks"} ({effectiveTextbooks.length})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t(
                        "bookshelfSubtitle",
                        "Read curriculum-approved textbooks online or download offline copies."
                      )}
                    </p>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => setIsAssignBooksOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 shrink-0 min-h-[44px]"
                  >
                    <Plus strokeWidth={1.75} size={16} />
                    <span>{language === "bn" ? "পাঠ্যবই যোগ / পরিবর্তন" : "Manage Textbooks"}</span>
                  </button>
                )}
              </div>

              {/* Search & Subject Filter Bar */}
              {effectiveTextbooks.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder={language === "bn" ? "বই খুঁজুন (শিরোনাম বা বিষয়)..." : "Search textbooks by title or subject..."}
                        value={bookshelfSearch}
                        onChange={(e) => setBookshelfSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {language === "bn"
                        ? `মোট ${effectiveTextbooks.length}টি বইয়ের মধ্যে ${filteredBooks.length}টি প্রদর্শিত`
                        : `Showing ${filteredBooks.length} of ${effectiveTextbooks.length} textbooks`}
                    </span>
                  </div>

                  {/* Subject filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {uniqueSubjects.map((sub: string) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setBookshelfFilter(sub)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          bookshelfFilter.toLowerCase() === sub.toLowerCase()
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Textbooks Grid */}
              {effectiveTextbooks.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
                    <BookMarked strokeWidth={1.75} size={28} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {language === "bn"
                      ? "আপনার শিক্ষক এখনও এই ক্লাসে কোনো পাঠ্যবই যুক্ত করেননি।"
                      : "Your teacher hasn't added any textbooks to this classroom yet."}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5">
                    {isTeacher
                      ? (language === "bn"
                          ? "শিক্ষার্থীদের পড়ার জন্য ৬ষ্ঠ শ্রেণির বোর্ড বই বুকশেলফে যুক্ত করুন।"
                          : "Assign NCTB textbooks so students can read and download them.")
                      : (language === "bn"
                          ? "শিক্ষক বই যুক্ত করলে এখানে স্বয়ংক্রিয়ভাবে দেখতে পাবেন।"
                          : "Textbooks will appear here once your instructor assigns them.")}
                  </p>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => setIsAssignBooksOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                    >
                      <Plus strokeWidth={1.75} size={16} />
                      <span>{language === "bn" ? "পাঠ্যবই যুক্ত করুন" : "Add Textbooks"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map((book: any) => (
                    <div
                      key={book.id}
                      className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                            {book.subject}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {book.grade}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {book.title}
                        </h4>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setReadingBook({
                              title: book.title,
                              driveUrl: book.driveUrl || "",
                              grade: book.grade,
                              subject: book.subject,
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs font-bold shadow-sm transition-all min-h-[38px]"
                        >
                          <BookMarked strokeWidth={1.75} size={15} />
                          <span>{t("readOnline", "Read Online")}</span>
                        </button>

                        {book.driveUrl && (
                          <a
                            href={book.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[38px] min-w-[38px]"
                            title={t("download", "Download")}
                          >
                            <Download strokeWidth={1.75} size={15} />
                          </a>
                        )}

                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            disabled={isDeletingBookId === book.id}
                            className="inline-flex items-center justify-center p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors min-h-[38px] min-w-[38px]"
                            title={language === "bn" ? "বইটি বুকশেলফ থেকে মুছে ফেলুন" : "Remove book from bookshelf"}
                          >
                            {isDeletingBookId === book.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 strokeWidth={1.75} size={15} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* 3. CHANNELS TAB */}
        {activeTab === "channels" && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[560px]">
            {/* Left Channel Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Class Channels
                </span>
                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 shrink-0">
                  Live Polling
                </span>
              </div>

              <div className="space-y-1 max-h-48 md:max-h-none overflow-y-auto">
                {classroom.channels.map((channel) => {
                  const isActive = channel.id === activeChannelId;
                  const isRestricted = channel.postPermission === "TEACHERS_ONLY";

                  return (
                    <button
                      key={channel.id}
                      onClick={() => {
                        setActiveChannelId(channel.id);
                        setChannelSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Hash
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span className="truncate">{channel.name}</span>
                      </div>
                      {isRestricted && (
                        <Lock
                          className={`h-3 w-3 shrink-0 ${
                            isActive ? "text-indigo-200" : "text-slate-400"
                          }`}
                          strokeWidth={2}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 px-2">
                <p className="text-[11px] text-slate-400 leading-normal">
                  Real-time discussion stream. Automatically refreshes every 3 seconds.
                </p>
              </div>
            </div>

            {/* Right Chat Stream */}
            <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 min-w-0">
              {/* Channel Header */}
              <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Hash className="h-5 w-5 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                    {activeChannel?.name || "channel"}
                  </span>
                  {activeChannel?.postPermission === "TEACHERS_ONLY" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold shrink-0">
                      <Lock className="h-3 w-3" strokeWidth={1.75} />
                      <span>Teachers Only</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {channelMessages.length} messages
                  </span>

                  {isTeacher && activeChannel && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setChannelSettingsOpen(!channelSettingsOpen)}
                        className="p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Channel Posting Permissions"
                      >
                        <Settings className="h-4 w-4" strokeWidth={1.75} />
                      </button>

                      {channelSettingsOpen && (
                        <div className="absolute right-0 top-8 z-30 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl animate-in fade-in duration-150 space-y-1">
                          <p className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Posting Rights
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateChannelPermission(activeChannel.id, "EVERYONE")
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              activeChannel.postPermission !== "TEACHERS_ONLY"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>Everyone can post</span>
                            {activeChannel.postPermission !== "TEACHERS_ONLY" && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateChannelPermission(activeChannel.id, "TEACHERS_ONLY")
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              activeChannel.postPermission === "TEACHERS_ONLY"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>Teachers only</span>
                            {activeChannel.postPermission === "TEACHERS_ONLY" && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[480px]">
                {channelMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Hash className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-medium">
                      This channel is quiet right now. Start the conversation!
                    </p>
                  </div>
                ) : (
                  channelMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isSenderTeacher = msg.sender?.role === "TEACHER";
                    const isEditingThis = editingMessageId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`group flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Sender Avatar with Initials Fallback */}
                        {msg.sender?.avatar ? (
                          <img
                            src={msg.sender.avatar}
                            alt={msg.sender.name || ""}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mt-1"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-200 dark:ring-indigo-800 shrink-0 mt-1">
                            {msg.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}

                        <div
                          className={`flex flex-col max-w-[85%] sm:max-w-[75%] min-w-0 ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 mb-1 flex-wrap ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]">
                              {msg.sender?.name}
                            </span>
                            {isSenderTeacher && (
                              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.2 rounded-md shrink-0">
                                Instructor
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                              {formatDate(msg.createdAt)}
                            </span>
                            {msg.isEdited && (
                              <span className="text-[10px] text-slate-400 italic shrink-0">
                                (edited)
                              </span>
                            )}

                            {/* Message actions on hover */}
                            {!isEditingThis && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 shrink-0">
                                {isMe && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditMessage(msg)}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Edit message"
                                  >
                                    <Edit3 className="h-3 w-3" strokeWidth={1.75} />
                                  </button>
                                )}
                                {(isMe || isTeacher) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {isEditingThis ? (
                            <div className="w-full space-y-1.5">
                              <input
                                type="text"
                                value={editingMessageContent}
                                onChange={(e) => setEditingMessageContent(e.target.value)}
                                className="w-full rounded-xl border border-indigo-400 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                autoFocus
                              />
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditMessage(msg.id)}
                                  className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm break-words max-w-full overflow-hidden whitespace-pre-wrap ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-tr-none"
                                  : "bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box or Locked Channel Banner */}
              {activeChannel?.postPermission === "TEACHERS_ONLY" && !isTeacher ? (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                  <span>Only teachers can send messages in #{activeChannel?.name}.</span>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message #${activeChannel?.name || "channel"}...`}
                      className="flex-1 rounded-2xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-slate-950"
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
              )}
            </div>
          </div>
        )}

        {/* 4. NOTEBOX TAB */}
        {activeTab === "notebox" && (
          <ClassroomNoteBox
            classroomId={classroomId}
            notes={classroom.notes || []}
            currentUserId={currentUser?.id}
            isTeacher={isTeacher}
            onRefreshNotes={fetchClassroom}
          />
        )}

        {/* 5. PEOPLE TAB */}
        {activeTab === "people" && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-sm space-y-8">
            {/* Teacher Section */}
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Course Instructor
                </h3>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {classroom.teacher.avatar ? (
                    <img
                      src={classroom.teacher.avatar}
                      alt={classroom.teacher.name}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-purple-500/20 shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm ring-2 ring-purple-500/20 shrink-0">
                      {classroom.teacher.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {classroom.teacher.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {classroom.teacher.email}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold px-3 py-1 border border-purple-200 dark:border-purple-800 shrink-0">
                  Lead Teacher
                </span>
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Enrolled Students ({classroom.enrollments.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl shrink-0">
                  Join Code: <strong className="text-indigo-600 dark:text-indigo-400">{classroom.code}</strong>
                </span>
              </div>

              {classroom.enrollments.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="mx-auto h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Users className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No students enrolled yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share course join code <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{classroom.code}</span> with your students to have them join the roster.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classroom.enrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-3.5 gap-3 border-b border-slate-100 dark:border-slate-800 last:border-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-2xl transition-colors"
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {enr.user.avatar ? (
                          <img
                            src={enr.user.avatar}
                            alt={enr.user.name}
                            className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-indigo-200 dark:ring-indigo-800">
                            {enr.user.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                              {enr.user.name}
                            </h4>
                            {enr.user.id === currentUser?.id && (
                              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.2 rounded-full shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{enr.user.email}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Joined {formatDate(enr.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Remove Button */}
                      {isTeacher && enr.user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => setStudentToRemove(enr.user)}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors"
                          title="Remove student from classroom"
                        >
                          <UserMinus size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
        students={enrolledStudents}
      />

      {/* Edit Assignment Modal (Teacher) */}
      <EditAssignmentModal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        onAssignmentUpdated={() => {
          fetchClassroom();
          setSubmissionToast("Assignment updated successfully.");
          setTimeout(() => setSubmissionToast(null), 3000);
        }}
        students={enrolledStudents}
      />

      {/* Submit Assignment Modal (Student) */}
      <AssignmentSubmitModal
        isOpen={!!selectedAssignmentForSubmit}
        onClose={() => setSelectedAssignmentForSubmit(null)}
        assignment={selectedAssignmentForSubmit}
        onSubmitted={() => {
          fetchClassroom();
          setSubmissionToast("Coursework deliverable submitted successfully.");
          setTimeout(() => setSubmissionToast(null), 3500);
        }}
      />

      {/* Grade Submissions Modal (Teacher) */}
      <TeacherGradingModal
        isOpen={!!selectedAssignmentForGrading}
        onClose={() => setSelectedAssignmentForGrading(null)}
        assignment={selectedAssignmentForGrading}
        onGraded={() => {
          fetchClassroom();
          setSubmissionToast("Student grade and feedback recorded.");
          setTimeout(() => setSubmissionToast(null), 3500);
        }}
      />

      {/* Remove Student Confirmation Modal (Teacher) */}
      <RemoveStudentModal
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        classroomId={classroom.id}
        student={studentToRemove}
        onStudentRemoved={() => {
          fetchClassroom();
          setSubmissionToast("Student removed from classroom.");
          setTimeout(() => setSubmissionToast(null), 3000);
        }}
      />

      {/* Delete Classroom Confirmation Modal (Teacher) */}
      <DeleteClassroomModal
        isOpen={isDeleteClassModalOpen}
        onClose={() => setIsDeleteClassModalOpen(false)}
        classroomId={classroom.id}
        classroomName={classroom.name}
      />

      {/* Create Quiz Modal (Teacher) */}
      <CreateQuizModal
        isOpen={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        classroomId={classroom.id}
        gradeLevel={classroom.gradeLevel}
        textbooks={classroom.textbooks}
        onQuizCreated={() => {
          fetchQuizzes();
          setSubmissionToast("Quiz published successfully.");
          setTimeout(() => setSubmissionToast(null), 3000);
        }}
      />

      {/* Edit Classroom Settings & Textbooks Modal (Teacher) */}
      {isEditClassOpen && (
        <EditClassModal
          isOpen={isEditClassOpen}
          onClose={() => setIsEditClassOpen(false)}
          classroom={{
            id: classroom.id,
            name: classroom.name,
            subject: classroom.subject,
            gradeLevel: classroom.gradeLevel,
            textbooks: classroom.textbooks,
          }}
          onClassUpdated={() => {
            fetchClassroom();
            setSubmissionToast(t("saveChanges", "Classroom updated successfully."));
            setTimeout(() => setSubmissionToast(null), 3000);
          }}
        />
      )}

      {/* Assign / Manage Textbooks Modal (Teacher Only) */}
      {isAssignBooksOpen && classroom && isTeacher && (
        <AssignBooksModal
          isOpen={isAssignBooksOpen}
          onClose={() => setIsAssignBooksOpen(false)}
          classroomId={classroom.id}
          classroomName={classroom.name}
          currentBookIds={
            classroom.bookIds && classroom.bookIds.length > 0
              ? classroom.bookIds
              : (classroom.textbooks || []).map((b) => b.id)
          }
          onSuccess={(updatedBookIds) => {
            const updatedBooks = booksData.filter((b) =>
              updatedBookIds.includes(b.id)
            );
            setClassroom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                bookIds: updatedBookIds,
                textbooks: updatedBooks,
              };
            });
            fetchClassroom();
            const msg =
              language === "bn"
                ? "বুকশেলফের পাঠ্যবই সফলভাবে আপডেট করা হয়েছে।"
                : "Classroom textbooks updated successfully.";
            setSubmissionToast(msg);
            setTimeout(() => setSubmissionToast(null), 3500);
          }}
        />
      )}

      {/* Embedded PDF Reader Modal for NCTB Textbooks */}
      {readingBook && (
        <PdfReaderModal
          isOpen={!!readingBook}
          onClose={() => setReadingBook(null)}
          title={readingBook.title}
          pdfUrl={readingBook.driveUrl}
          grade={readingBook.grade}
          subject={readingBook.subject}
        />
      )}

      {/* Quiz Taking / Review Modal (Student) */}
      <QuizTakingModal
        isOpen={!!takingQuiz}
        onClose={() => setTakingQuiz(null)}
        classroomId={classroom.id}
        quiz={takingQuiz}
        onSubmitted={() => {
          fetchQuizzes();
          setSubmissionToast("Quiz submitted and auto-graded.");
          setTimeout(() => setSubmissionToast(null), 3500);
        }}
      />

      {/* Quiz Submissions Modal (Teacher) */}
      <QuizSubmissionsModal
        isOpen={!!selectedQuizSubmissions}
        onClose={() => setSelectedQuizSubmissions(null)}
        quizTitle={selectedQuizSubmissions?.title || "Quiz"}
        submissions={selectedQuizSubmissions?.submissions || []}
        totalPoints={
          selectedQuizSubmissions?.questions?.reduce(
            (sum: number, q: any) => sum + (q.points || 1),
            0
          ) || 0
        }
      />

      {/* Edit Announcement Modal */}
      <EditAnnouncementModal
        isOpen={!!editingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        classroomId={classroom.id}
        announcement={editingAnnouncement}
        onAnnouncementUpdated={() => {
          fetchClassroom();
          setSubmissionToast("Announcement updated successfully.");
          setTimeout(() => setSubmissionToast(null), 3000);
        }}
      />

      {/* Leave Classroom Modal (Student) */}
      <LeaveClassroomModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        classroomId={classroom.id}
        classroomName={classroom.name}
        onSuccess={() => {
          router.push("/dashboard?view=enrolled");
        }}
      />

      {/* Subtle Toast Feedback (No Confetti) */}
      {submissionToast && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/90 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle strokeWidth={1.75} size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{submissionToast}</span>
        </div>
      )}
    </div>
  );
}
