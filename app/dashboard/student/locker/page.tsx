"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  Clock,
  Calendar,
  Sparkles,
  HelpCircle,
  FileText,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Target,
  BarChart2,
  X,
  Copy,
  Check,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  Filter,
  Paperclip,
  Upload,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PersonalGoal {
  id: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SummaryData {
  summary: string;
  keyTakeaways: string[];
  flashcards: Array<{ front: string; back: string }>;
}

export default function AcademicLockerPage() {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Goals state
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Note Creator / Editor modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: "",
    subject: "General",
    tags: "",
    content: "",
    fileUrl: "",
  });
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileSize, setAttachedFileSize] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pomodoro Timer state
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState("General");
  const [loggedNotification, setLoggedNotification] = useState<string | null>(null);

  // AI Helper states
  const [activeAiNote, setActiveAiNote] = useState<PersonalNote | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Fetch Notes & Goals
  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/student/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setSubjects(["All", ...(data.subjects || [])]);
      }
    } catch (e) {
      console.error("Failed to load notes", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const res = await fetch("/api/student/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (e) {
      console.error("Failed to load goals", e);
    }
  };

  useEffect(() => {
    loadNotes();
    loadGoals();
  }, []);

  // Pomodoro Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleLogStudySession(timerMinutes, `Completed ${timerMinutes}m Pomodoro session`);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeftSeconds, timerMinutes]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handlePauseTimer = () => setIsTimerRunning(false);
  const handleResetTimer = (mins = timerMinutes) => {
    setIsTimerRunning(false);
    setTimeLeftSeconds(mins * 60);
  };

  const handleSetTimerMinutes = (mins: number) => {
    setTimerMinutes(mins);
    handleResetTimer(mins);
  };

  const handleLogStudySession = async (mins: number, sessionNotes?: string) => {
    try {
      const res = await fetch("/api/student/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: timerSubject || "General",
          durationMinutes: mins,
          notes: sessionNotes || `Logged ${mins} min focus session`,
        }),
      });
      if (res.ok) {
        setLoggedNotification(`Successfully logged ${mins}m focus time for ${timerSubject}!`);
        setTimeout(() => setLoggedNotification(null), 4000);
      }
    } catch (e) {
      console.error("Failed to log session", e);
    }
  };

  // File Upload Handlers (safely reads Base64 data URL up to 2MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError(null);

    // 2MB size limit to safely adhere to Vercel serverless request body bounds
    if (file.size > 2 * 1024 * 1024) {
      setFileUploadError("File size exceeds 2MB limit. Please attach a file smaller than 2MB or use an external URL.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNoteForm((prev) => ({ ...prev, fileUrl: dataUrl }));
      setAttachedFileName(file.name);
      setAttachedFileSize((file.size / 1024).toFixed(1) + " KB");
    };
    reader.onerror = () => {
      setFileUploadError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setNoteForm((prev) => ({ ...prev, fileUrl: "" }));
    setAttachedFileName(null);
    setAttachedFileSize(null);
    setFileUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Note CRUD
  const handleOpenCreateNote = () => {
    setEditingNote(null);
    setAttachedFileName(null);
    setAttachedFileSize(null);
    setFileUploadError(null);
    setNoteForm({
      title: "",
      subject: selectedSubject !== "All" ? selectedSubject : "General",
      tags: "",
      content: "",
      fileUrl: "",
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: PersonalNote) => {
    setEditingNote(note);
    if (note.fileUrl) {
      if (note.fileUrl.startsWith("data:")) {
        setAttachedFileName("Attached Document / Image");
        setAttachedFileSize("Stored Attachment");
      } else {
        setAttachedFileName(null);
        setAttachedFileSize(null);
      }
    } else {
      setAttachedFileName(null);
      setAttachedFileSize(null);
    }
    setFileUploadError(null);
    setNoteForm({
      title: note.title,
      subject: note.subject,
      tags: note.tags.join(", "),
      content: note.content,
      fileUrl: note.fileUrl || "",
    });
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;

    try {
      setIsSavingNote(true);
      const url = editingNote ? `/api/student/notes/${editingNote.id}` : "/api/student/notes";
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });

      if (res.ok) {
        setIsEditorOpen(false);
        await loadNotes();
      }
    } catch (e) {
      console.error("Failed to save note", e);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study note?")) return;
    try {
      const res = await fetch(`/api/student/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete note", e);
    }
  };

  // Goals CRUD
  const handleToggleGoal = async (id: string, currentStatus: boolean) => {
    try {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isCompleted: !currentStatus } : g))
      );
      await fetch(`/api/student/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentStatus }),
      });
    } catch (e) {
      console.error("Failed to toggle goal", e);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    try {
      const res = await fetch("/api/student/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          targetDate: newGoalDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => [...prev, data.goal]);
        setNewGoalTitle("");
        setNewGoalDate("");
        setIsAddingGoal(false);
      }
    } catch (e) {
      console.error("Failed to add goal", e);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      await fetch(`/api/student/goals/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete goal", e);
    }
  };

  // AI Study Helper handlers
  const handleGenerateQuiz = async (note: PersonalNote) => {
    setActiveAiNote(note);
    setQuizData(null);
    setSummaryData(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/study-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quiz",
          noteTitle: note.title,
          subject: note.subject,
          noteContent: note.content,
        }),
      });
      const data = await res.json();
      if (res.ok && data.quiz) {
        setQuizData(data.quiz);
      } else {
        setAiError(data.error || "Failed to generate quiz questions.");
      }
    } catch (e) {
      setAiError("Connection error while generating quiz.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateSummary = async (note: PersonalNote) => {
    setActiveAiNote(note);
    setSummaryData(null);
    setQuizData(null);
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/study-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summary",
          noteTitle: note.title,
          subject: note.subject,
          noteContent: note.content,
        }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummaryData({
          summary: data.summary,
          keyTakeaways: data.keyTakeaways || [],
          flashcards: data.flashcards || [],
        });
      } else {
        setAiError(data.error || "Failed to generate summary.");
      }
    } catch (e) {
      setAiError("Connection error while summarizing note.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSubject =
        selectedSubject === "All" || n.subject.toLowerCase() === selectedSubject.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q));
      return matchesSubject && matchesSearch;
    });
  }, [notes, selectedSubject, searchQuery]);

  // Timer format display
  const timerMinutesDisplay = String(Math.floor(timeLeftSeconds / 60)).padStart(2, "0");
  const timerSecondsDisplay = String(timeLeftSeconds % 60).padStart(2, "0");

  const completedGoalsCount = goals.filter((g) => g.isCompleted).length;
  const goalProgressRate = goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-emerald-100">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Private Self-Study Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Academic Locker & Study Hub
              </h1>
              <p className="text-sm sm:text-base text-emerald-100 max-w-2xl">
                Organize personal notes, track study milestones, run focus sessions, and use Gemini AI
                to generate custom practice quizzes and smart flashcards.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/student/analytics"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-sm"
              >
                <BarChart2 className="w-4 h-4 text-emerald-300" />
                <span>My Study Analytics</span>
              </Link>
              <button
                onClick={handleOpenCreateNote}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-bold shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Study Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {loggedNotification && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between text-emerald-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{loggedNotification}</span>
            </div>
            <button
              onClick={() => setLoggedNotification(null)}
              className="text-emerald-500 hover:text-emerald-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Grid: Pomodoro Timer & Personal Goals Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer Widget */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Focus & Pomodoro Timer</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                Self-Paced
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-4 space-y-4">
              {/* Digital Timer Display */}
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 font-mono">
                {timerMinutesDisplay}:{timerSecondsDisplay}
              </div>

              {/* Subject Selector for Session */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Studying:</span>
                <select
                  value={timerSubject}
                  onChange={(e) => setTimerSubject(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="General">General</option>
                  <option value="Math">Math</option>
                  <option value="Science">Science</option>
                  <option value="Physics">Physics</option>
                  <option value="English">English</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="History">History</option>
                </select>
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center gap-2">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleSetTimerMinutes(m)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                      timerMinutes === m
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleResetTimer(timerMinutes)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {isTimerRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Focus</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleLogStudySession(timerMinutes, `Manual session log (${timerMinutes}m)`)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
                title="Manually log this session to your analytics"
              >
                Log Now
              </button>
            </div>
          </div>

          {/* Personal Goals Widget */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-base">Personal Study Milestones</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {completedGoalsCount}/{goals.length} Completed ({goalProgressRate}%)
                  </span>
                  <button
                    onClick={() => setIsAddingGoal(!isAddingGoal)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${goalProgressRate}%` }}
                />
              </div>

              {/* Add Goal Form Inline */}
              {isAddingGoal && (
                <form onSubmit={handleAddGoal} className="mb-4 p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Finish Calculus Chapter 4 review"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={newGoalDate}
                      onChange={(e) => setNewGoalDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all"
                    >
                      Add Goal
                    </button>
                  </div>
                </form>
              )}

              {/* Goals list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {goals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No personal goals set yet. Click "+" to set your first target!
                  </p>
                ) : (
                  goals.map((g) => (
                    <div
                      key={g.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        g.isCompleted
                          ? "bg-slate-50 border-slate-200 text-slate-400"
                          : "bg-white border-slate-200 text-slate-800 hover:border-indigo-200"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleGoal(g.id, g.isCompleted)}
                        className="flex items-center gap-2.5 text-left flex-1"
                      >
                        {g.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 hover:text-indigo-600 shrink-0" />
                        )}
                        <span className={`text-xs font-medium ${g.isCompleted ? "line-through text-slate-400" : ""}`}>
                          {g.title}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(g.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Remove Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Keep your milestones updated to boost study consistency</span>
              </span>
            </div>
          </div>
        </div>

        {/* Locker Search & Subject Filter Bar */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, keywords, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Note count badge */}
            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredNotes.length} of {notes.length} notes
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubject.toLowerCase() === subj.toLowerCase()
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">No Study Notes Found</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {searchQuery || selectedSubject !== "All"
                ? "No notes matched your search or subject filter. Try clearing filters."
                : "Your academic locker is empty! Create personal notes to organize your study topics, formulas, and resources."}
            </p>
            <button
              onClick={handleOpenCreateNote}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Note Header */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {note.subject}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {note.title}
                  </h4>

                  {/* Content Preview */}
                  <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-line leading-relaxed">
                    {note.content}
                  </p>

                  {/* Attached File/Link */}
                  {note.fileUrl && (
                    <div className="pt-1">
                      {note.fileUrl.startsWith("data:image/") ? (
                        <div className="space-y-1">
                          <a
                            href={note.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-h-32 group/img"
                          >
                            <img
                              src={note.fileUrl}
                              alt={note.title}
                              className="w-full h-32 object-cover group-hover/img:scale-105 transition-transform"
                            />
                          </a>
                          <span className="text-[10px] text-slate-400">Attached Image</span>
                        </div>
                      ) : note.fileUrl.startsWith("data:") ? (
                        <a
                          href={note.fileUrl}
                          download={`${note.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_attachment`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[200px]">Download Attached File</span>
                        </a>
                      ) : (
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[200px]">Reference Link</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions & AI Helper Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {/* Prominent Practice Quiz Button */}
                  <button
                    onClick={() => handleGenerateQuiz(note)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-purple-200 transition-all active:scale-[0.98]"
                    title="Generate 3-5 Practice Questions with Gemini AI"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                    <span>Generate Practice Quiz with AI</span>
                  </button>

                  {/* Secondary Actions */}
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      onClick={() => handleGenerateSummary(note)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-100 transition-colors"
                      title="Summarize key takeaways with Gemini AI"
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Smart Summary</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditNote(note)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note Editor Modal */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingNote ? "Edit Study Note" : "Create Personal Study Note"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Relational Calculus & Normal Forms"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Math, Physics, Computer Science"
                      value={noteForm.subject}
                      onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. formulas, exam-review, ch2"
                      value={noteForm.tags}
                      onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Study Material Attachment or Reference Link (Optional)
                  </label>

                  {/* Local File Attachment Option */}
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Upload Document / Image (Max 2MB)</span>
                      </div>
                      <span className="text-[11px] text-slate-400">PDF, PNG, JPG, TXT</span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*,.txt,.md"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />

                    {fileUploadError && (
                      <p className="text-xs text-rose-600 font-medium">{fileUploadError}</p>
                    )}

                    {attachedFileName && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate">{attachedFileName}</span>
                          {attachedFileSize && (
                            <span className="text-[10px] text-emerald-600 shrink-0">({attachedFileSize})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachment}
                          className="text-emerald-700 hover:text-rose-600 p-1"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* External Resource URL Alternative */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                      <span>Or paste an external resource URL</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://arxiv.org/..."
                      value={noteForm.fileUrl && !noteForm.fileUrl.startsWith("data:") ? noteForm.fileUrl : ""}
                      onChange={(e) => {
                        setNoteForm({ ...noteForm, fileUrl: e.target.value });
                        setAttachedFileName(null);
                        setAttachedFileSize(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Content / Notes
                  </label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write your study notes, formulas, questions, or definitions here..."
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNote}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {isSavingNote ? "Saving..." : editingNote ? "Update Note" : "Save to Locker"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Study Helper Modal: Quiz or Summary */}
        {(isAiLoading || quizData || summaryData || aiError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {quizData ? "Interactive AI Practice Quiz" : summaryData ? "AI Smart Summary & Flashcards" : "Generating with Gemini..."}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Topic: {activeAiNote?.title} ({activeAiNote?.subject})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setQuizData(null);
                    setSummaryData(null);
                    setActiveAiNote(null);
                    setAiError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loading State */}
              {isAiLoading && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">
                    Gemini AI is analyzing your study notes...
                  </p>
                  <p className="text-xs text-slate-400">
                    Formulating practice items tailored to your content.
                  </p>
                </div>
              )}

              {/* Error State */}
              {aiError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {aiError}
                </div>
              )}

              {/* Interactive Quiz View */}
              {quizData && (
                <div className="space-y-6">
                  {quizData.map((q, qIndex) => {
                    const selected = quizAnswers[qIndex];
                    const isCorrect = selected === q.correctAnswer;

                    return (
                      <div
                        key={qIndex}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-purple-700 text-xs px-2 py-0.5 rounded-md bg-purple-100 shrink-0">
                            Q{qIndex + 1}
                          </span>
                          <h4 className="font-semibold text-slate-900 text-sm">{q.question}</h4>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            let optionClass = "border-slate-200 bg-white text-slate-700 hover:border-purple-300";
                            if (quizSubmitted) {
                              if (optIndex === q.correctAnswer) {
                                optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                              } else if (selected === optIndex) {
                                optionClass = "border-rose-400 bg-rose-50 text-rose-800";
                              }
                            } else if (selected === optIndex) {
                              optionClass = "border-purple-600 bg-purple-50 text-purple-900 font-semibold ring-1 ring-purple-600";
                            }

                            return (
                              <button
                                key={optIndex}
                                disabled={quizSubmitted}
                                onClick={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }))
                                }
                                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${optionClass}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIndex === q.correctAnswer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div
                            className={`p-2.5 rounded-xl text-xs font-medium ${
                              isCorrect ? "bg-emerald-100/70 text-emerald-800" : "bg-slate-200/70 text-slate-700"
                            }`}
                          >
                            <span className="font-bold">{isCorrect ? "✓ Correct: " : "💡 Explanation: "}</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-500">
                      {quizSubmitted && (
                        <span>
                          Score:{" "}
                          <strong className="text-purple-700">
                            {
                              Object.entries(quizAnswers).filter(
                                ([idx, ans]) => ans === quizData[Number(idx)].correctAnswer
                              ).length
                            }
                            /{quizData.length}
                          </strong>
                        </span>
                      )}
                    </div>

                    {!quizSubmitted ? (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length === 0}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow transition-all"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Smart Summary & Flashcards View */}
              {summaryData && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">
                          Key Concept Summary
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(summaryData.summary + "\n\n" + summaryData.keyTakeaways.join("\n"));
                          setCopiedSummary(true);
                          setTimeout(() => setCopiedSummary(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSummary ? "Copied" : "Copy Notes"}</span>
                      </button>
                    </div>
                    <p className="text-xs text-indigo-950 leading-relaxed">{summaryData.summary}</p>
                  </div>

                  {/* Bullet Takeaways */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Core Takeaways
                    </h4>
                    <ul className="space-y-1.5">
                      {summaryData.keyTakeaways.map((takeaway, idx) => (
                        <li key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Flashcards */}
                  {summaryData.flashcards && summaryData.flashcards.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                        Study Flashcards ({summaryData.flashcards.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {summaryData.flashcards.map((fc, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2"
                          >
                            <span className="text-[10px] font-bold text-purple-600 uppercase">
                              Concept #{idx + 1}
                            </span>
                            <div className="font-bold text-slate-900 text-xs">{fc.front}</div>
                            <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                              {fc.back}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
