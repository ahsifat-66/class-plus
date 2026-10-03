"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  BookMarked,
  Pencil,
  FileCheck,
  Check,
  BarChart,
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { flatBooksData, Book } from "@/data/booksData";

interface QuestionItem {
  question: string;
  options: string[];
  correctOptionIndex: number;
  answerIndex?: number;
  points: number | "";
  explanation?: string;
  pageReference?: string;
}

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  gradeLevel?: string | null;
  textbooks?: Array<{ id: string; title: string; subject: string; driveUrl?: string | null }>;
  bookIds?: string[];
  onQuizCreated: () => void;
}

type QuizMode = "ai" | "manual";
type DifficultyLevel = "Easy" | "Medium" | "Hard";

export default function CreateQuizModal({
  isOpen,
  onClose,
  classroomId,
  gradeLevel,
  textbooks = [],
  bookIds = [],
  onQuizCreated,
}: CreateQuizModalProps) {
  const { t, language } = useLanguage();

  // Mode: Default to "ai" for convenient intelligent generation, or switch to "manual"
  const [activeMode, setActiveMode] = useState<QuizMode>("ai");

  // Quiz Meta
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">(15);
  const [dueDate, setDueDate] = useState("");

  // Questions
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 1,
    },
  ]);

  // AI Generator States
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [aiChapter, setAiChapter] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>("Medium");
  const [activeVersion, setActiveVersion] = useState<"bangla" | "english">("bangla");
  const [aiNumQuestions, setAiNumQuestions] = useState<number>(10);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Dynamically resolve assigned books for this classroom with versions
  const assignedBooks = useMemo(() => {
    if (textbooks && textbooks.length > 0) {
      return textbooks.map((tb) => {
        const fullBook = flatBooksData.find((b) => b.id === tb.id);
        const version: "bangla" | "english" =
          fullBook?.version || (tb.id.includes("-en-") ? "english" : "bangla");
        return {
          id: tb.id,
          title: tb.title,
          subject: tb.subject,
          grade: fullBook?.grade || gradeLevel || "Class 6",
          version,
          driveUrl: tb.driveUrl || fullBook?.driveUrl || "",
        };
      });
    }
    if (bookIds && bookIds.length > 0) {
      return flatBooksData
        .filter((b) => bookIds.includes(b.id))
        .map((b) => ({
          id: b.id,
          title: b.title,
          subject: b.subject,
          grade: b.grade || gradeLevel || "Class 6",
          version: (b.version || (b.id.includes("-en-") ? "english" : "bangla")) as "bangla" | "english",
          driveUrl: b.driveUrl || "",
        }));
    }
    // Fallback to Grade 6 catalog if none explicitly assigned yet
    return flatBooksData
      .filter((b) => b.grade === "class-6" || b.grade === "Class 6")
      .map((b) => ({
        id: b.id,
        title: b.title,
        subject: b.subject,
        grade: b.grade || gradeLevel || "Class 6",
        version: (b.version || (b.id.includes("-en-") ? "english" : "bangla")) as "bangla" | "english",
        driveUrl: b.driveUrl || "",
      }));
  }, [textbooks, bookIds, gradeLevel]);

  // Separate books by version
  const banglaAssignedBooks = useMemo(() => {
    return assignedBooks.filter((b) => b.version === "bangla");
  }, [assignedBooks]);

  const englishAssignedBooks = useMemo(() => {
    return assignedBooks.filter((b) => b.version === "english");
  }, [assignedBooks]);

  const currentVersionBooks = activeVersion === "bangla" ? banglaAssignedBooks : englishAssignedBooks;

  // Initialize or update selected book based on active version tab
  useEffect(() => {
    if (isOpen) {
      setError("");
      setAiError("");
      const available = activeVersion === "bangla" ? banglaAssignedBooks : englishAssignedBooks;
      if (available.length > 0) {
        setSelectedBookId((prev) => {
          const stillValid = available.some((b) => b.id === prev);
          return stillValid ? prev : available[0].id;
        });
      } else {
        setSelectedBookId("");
      }
    }
  }, [isOpen, activeVersion, banglaAssignedBooks, englishAssignedBooks]);

  const selectedBook = useMemo(() => {
    return (
      currentVersionBooks.find((b) => b.id === selectedBookId) ||
      currentVersionBooks[0] ||
      assignedBooks[0]
    );
  }, [currentVersionBooks, selectedBookId, assignedBooks]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, question: val } : q))
    );
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleCorrectOptionChange = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, correctOptionIndex: optIdx, answerIndex: optIdx } : q
      )
    );
  };

  const handlePointsChange = (qIdx: number, val: string | number) => {
    if (val === "") {
      setQuestions((prev) =>
        prev.map((q, i) => (i === qIdx ? { ...q, points: "" } : q))
      );
      return;
    }
    const parsed = typeof val === "number" ? val : parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setQuestions((prev) =>
        prev.map((q, i) => (i === qIdx ? { ...q, points: parsed } : q))
      );
    }
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, explanation: val } : q))
    );
  };

  const handlePageReferenceChange = (qIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, pageReference: val } : q))
    );
  };

  // Generate Questions from Assigned Textbook via AI
  const handleGenerateFromBook = async () => {
    if (!aiChapter.trim()) {
      setAiError(
        language === "bn"
          ? "অধ্যায় বা বিষয়বস্তুর নাম লিখুন।"
          : "Please enter the chapter or topic name."
      );
      return;
    }

    try {
      setIsGeneratingAi(true);
      setAiError("");
      setAiSuccessMsg("");

      const res = await fetch("/api/quiz/generate-from-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveUrl: selectedBook?.driveUrl || "",
          chapter: aiChapter.trim(),
          difficulty: aiDifficulty,
          numberOfQuestions: aiNumQuestions,
          bookTitle: selectedBook?.title || "বোর্ড বই",
          subject: selectedBook?.subject || "General",
          gradeLevel: gradeLevel || selectedBook?.grade || "Class 6",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions with AI.");
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const sanitizeExplanation = (exp: string) => {
          const trimmed = (exp || "").trim();
          if (
            trimmed.includes("একাডেমিক যুক্তির ভিত্তিতে") ||
            trimmed.includes("নির্বাচনটি প্রাসঙ্গিক এবং সঠিক") ||
            trimmed.includes("পাঠ্যবই অনুযায়ী সঠিক উত্তর হলো অপশন")
          ) {
            return "";
          }
          return trimmed;
        };

        const generated = data.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          correctOptionIndex: typeof q.answerIndex === "number" ? q.answerIndex : (q.correctOptionIndex ?? 0),
          answerIndex: typeof q.answerIndex === "number" ? q.answerIndex : (q.correctOptionIndex ?? 0),
          points: q.points || 1,
          explanation: sanitizeExplanation(q.explanation || q.rationale || q.reasoning || q.feedback || q.solution || q.details || ""),
          pageReference: (q.pageReference || q.page_reference || q.textbookReference || q.reference || "").trim(),
        }));

        setQuestions(generated);

        // Preload title if currently blank
        if (!title.trim()) {
          const defaultTitle =
            language === "bn"
              ? `${selectedBook?.title || "কুইজ"}: ${aiChapter.trim()}`
              : `${selectedBook?.title || "Quiz"}: ${aiChapter.trim()}`;
          setTitle(defaultTitle);
        }

        // Set success feedback and switch to review mode
        setAiSuccessMsg(
          language === "bn"
            ? `জেমিনি এআই সফলভাবে ${generated.length}টি প্রশ্ন তৈরি করেছে! নিচে প্রশ্নগুলো পর্যালোচনা ও সম্পাদন করুন।`
            : `Successfully generated ${generated.length} MCQs! Review and edit below.`
        );
        setActiveMode("manual");
      } else {
        throw new Error("No questions were returned from AI.");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setAiError(err.message || "Failed to generate quiz from textbook.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(language === "bn" ? "কুইজের শিরোনাম লিখুন।" : "Quiz title is required.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(
          language === "bn"
            ? `প্রশ্ন ${i + 1} খালি রাখা যাবে না।`
            : `Question ${i + 1} cannot be blank.`
        );
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(
            language === "bn"
              ? `প্রশ্ন ${i + 1}-এর অপশন ${String.fromCharCode(65 + j)} খালি রাখা যাবে না।`
              : `Option ${String.fromCharCode(65 + j)} for Question ${i + 1} cannot be blank.`
          );
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          timeLimitMinutes: Number(timeLimitMinutes) || 15,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          questions: questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            points: Number(q.points) || 1,
            explanation: (q.explanation || (q as any).rationale || (q as any).reasoning || (q as any).feedback || (q as any).solution || (q as any).details)?.trim() || undefined,
            pageReference: q.pageReference?.trim() || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create quiz.");
      }

      onQuizCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error creating quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl my-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <HelpCircle strokeWidth={1.75} size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === "bn" ? "নতুন কুইজ তৈরি করুন" : "Create Classroom Quiz"}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {gradeLevel || "Class 6"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "bn"
                  ? "অ্যাসাইনকৃত পাঠ্যবই থেকে জেমিনি এআই দিয়ে অথবা ম্যানুয়ালি প্রশ্ন তৈরি করুন"
                  : "Generate MCQs from assigned textbooks with Gemini AI or craft manually"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Method Switcher Tabs (AI vs Manual) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveMode("ai")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === "ai"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles size={16} className="text-purple-500 dark:text-purple-400" />
              <span>{language === "bn" ? "এআই দিয়ে তৈরি করুন" : "Generate with AI"}</span>
              <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Gemini 1.5
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("manual")}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeMode === "manual"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Pencil size={15} />
              <span>{language === "bn" ? "ম্যানুয়ালি তৈরি করুন" : "Create Manually"}</span>
              <span className="hidden sm:inline-block text-[10px] font-mono opacity-60">
                ({questions.length})
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Success Banner if questions generated */}
          {aiSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{aiSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiSuccessMsg("")}
                className="text-emerald-500 hover:text-emerald-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 1. "Generate with AI" Mode Panel */}
          {activeMode === "ai" && (
            <div className="rounded-3xl border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
                  <Sparkles size={20} strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    {language === "bn"
                      ? "পাঠ্যবই থেকে স্বয়ংক্রিয় কুইজ তৈরি (Gemini 1.5 Flash)"
                      : "Generate Quiz from Assigned Textbook"}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === "bn"
                      ? "ক্লাসরুমের নির্ধারিত পাঠ্যবই এবং নির্দিষ্ট অধ্যায় নির্বাচন করে নিমেষেই মানসম্মত MCQ প্রস্তুত করুন।"
                      : "Select an assigned textbook and chapter to generate curriculum-aligned questions."}
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4 pt-1">
                {/* Version Selector Tabs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>{language === "bn" ? "কারিকুলাম ভার্সন নির্বাচন" : "Select Curriculum Version"}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {language === "bn" ? "নির্ধারিত পাঠ্যবইসমূহ" : "Assigned Books"}
                    </span>
                  </label>
                  <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-2 gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveVersion("bangla")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeVersion === "bangla"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <span>বাংলা ভার্সন</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          activeVersion === "bangla"
                            ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {banglaAssignedBooks.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveVersion("english")}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeVersion === "english"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      <span>English Version</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          activeVersion === "english"
                            ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {englishAssignedBooks.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 1. Subject / Book Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <BookMarked size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {language === "bn"
                        ? activeVersion === "bangla"
                          ? "বাংলা ভার্সনের পাঠ্যবই নির্বাচন করুন"
                          : "English Version পাঠ্যবই নির্বাচন করুন"
                        : activeVersion === "bangla"
                        ? "Select Bangla Version Textbook"
                        : "Select English Version Textbook"}
                    </span>
                  </label>
                  {currentVersionBooks.length > 0 ? (
                    <select
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                    >
                      {currentVersionBooks.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.subject})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                      {language === "bn"
                        ? `এই ক্লাসরুমে কোনো ${
                            activeVersion === "bangla" ? "বাংলা" : "English"
                          } ভার্সনের পাঠ্যবই যুক্ত করা হয়নি। বুকশেলফে বই যোগ করার পর এখানে সরাসরি প্রদর্শিত হবে।`
                        : `No ${
                            activeVersion === "bangla" ? "Bangla" : "English"
                          } version textbooks currently assigned to this classroom.`}
                    </div>
                  )}
                </div>

                {/* 2. Chapter / Topic Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {language === "bn" ? "অধ্যায় বা বিষয়বস্তুর নাম" : "Chapter / Topic Name"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiChapter}
                    onChange={(e) => setAiChapter(e.target.value)}
                    placeholder={
                      language === "bn"
                        ? "অধ্যায় বা বিষয়বস্তুর নাম লিখুন (e.g., অধ্যায় ২: জীবের বৃদ্ধি বা Motion)"
                        : "Enter chapter or topic name (e.g., Chapter 2: Cell Structure or Motion)"
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                  />
                </div>

                {/* 3. Difficulty Selector & 4. Number of Questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <BarChart size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>{language === "bn" ? "কাঠিন্য স্তর (Difficulty)" : "Difficulty Level"}</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                      {(["Easy", "Medium", "Hard"] as DifficultyLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setAiDifficulty(level)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                            aiDifficulty === level
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {level === "Easy"
                            ? language === "bn" ? "সহজ" : "Easy"
                            : level === "Medium"
                            ? language === "bn" ? "মাঝারি" : "Medium"
                            : language === "bn" ? "কঠিন" : "Hard"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "bn" ? "প্রশ্নের সংখ্যা (MCQs)" : "Number of Questions"}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                      {[5, 10, 20, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAiNumQuestions(num)}
                          className={`py-2 text-center rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                            aiNumQuestions === num
                              ? "bg-purple-600 text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* Generate Button */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === "bn"
                      ? "প্রশ্ন তৈরির পর আপনি প্রতিটি প্রশ্ন পর্যালোচনা ও সম্পাদন করতে পারবেন।"
                      : "Generated questions will appear in the review editor below."}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateFromBook}
                    disabled={isGeneratingAi || !aiChapter.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>
                          {language === "bn"
                            ? "পাঠ্যবই থেকে প্রশ্ন তৈরি হচ্ছে..."
                            : "Generating questions with Gemini..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>
                          {language === "bn"
                            ? `কুইজ তৈরি করুন (${aiNumQuestions}টি MCQ)`
                            : `Generate Quiz (${aiNumQuestions} MCQs)`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. "Create Manually" / Review & Publish Form */}
          <form id="create-quiz-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {language === "bn" ? "কুইজের সাধারণ তথ্য ও প্রশ্ন পর্যালোচনা" : "Quiz Overview & Questions Review"}
                </h4>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {questions.length} {language === "bn" ? "টি প্রশ্ন" : "questions"}
              </span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "bn" ? "কুইজের শিরোনাম" : "Quiz Title"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "যেমন: বিজ্ঞান: অধ্যায় ২ - জীবের বৃদ্ধি ও চলন"
                      : "e.g. Science: Chapter 2 - Cell Growth and Motion"
                  }
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "bn" ? "নির্দেশনা / বিবরণ (ঐচ্ছিক)" : "Instructions / Description (Optional)"}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "শিক্ষার্থীদের জন্য নির্দেশনা (যেমন: প্রতিটি প্রশ্নের সঠিক উত্তর নির্বাচন করুন)..."
                      : "Instructions for students (e.g. select the most accurate option, no negative marking)..."
                  }
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {language === "bn" ? "সময়সীমা (মিনিট)" : "Time Limit (Minutes)"}
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setTimeLimitMinutes("");
                      return;
                    }
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0) {
                      setTimeLimitMinutes(num);
                    }
                  }}
                  onBlur={() => {
                    if (timeLimitMinutes === "" || Number(timeLimitMinutes) <= 0) {
                      setTimeLimitMinutes(15);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === "bn" ? "জমা দেওয়ার শেষ সময় (ঐচ্ছিক)" : "Due Date (Optional)"}
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {language === "bn" ? "প্রশ্নমালা" : "Quiz Questions"} ({questions.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  {language === "bn" ? "মোট নম্বর:" : "Total Points:"}{" "}
                  {questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-xs font-bold transition-colors min-h-[36px]"
              >
                <Plus size={14} />
                <span>{language === "bn" ? "প্রশ্ন যোগ করুন" : "Add Question"}</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {language === "bn" ? `প্রশ্ন ${qIdx + 1}` : `Question ${qIdx + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{language === "bn" ? "নম্বর:" : "Pts:"}</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.points}
                          onChange={(e) => handlePointsChange(qIdx, e.target.value)}
                          onBlur={() => {
                            if (q.points === "" || Number(q.points) <= 0) {
                              handlePointsChange(qIdx, 1);
                            }
                          }}
                          className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-xs min-h-[28px]"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Delete question"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder={
                      language === "bn"
                        ? "প্রশ্নের বিষয়বস্তু লিখুন..."
                        : "Enter question text..."
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                    required
                  />

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {language === "bn"
                        ? "অপশনসমূহ (সঠিক উত্তর নির্বাচনে রেডিও বাটনে ক্লিক করুন):"
                        : "Options (Click radio to select the correct answer):"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleCorrectOptionChange(qIdx, optIdx)}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIdx}-correct`}
                              checked={isCorrect}
                              onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                              className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="font-mono text-xs font-bold text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none min-h-[32px]"
                              required
                            />
                            {isCorrect && (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Explanation & NCTB Page Reference */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <BookOpen size={13} className="text-indigo-600 dark:text-indigo-400" />
                          <span>{language === "bn" ? "পাঠ্যবই রেফারেন্স" : "NCTB Reference"}</span>
                        </label>
                        <input
                          type="text"
                          value={q.pageReference || ""}
                          onChange={(e) => handlePageReferenceChange(qIdx, e.target.value)}
                          placeholder={language === "bn" ? "যেমন: অধ্যায় ৩, পৃষ্ঠা: ৪৫-৪৭" : "e.g. Chapter 3, Pages: 45-47"}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Lightbulb size={13} className="text-amber-500" />
                          <span>{language === "bn" ? "প্রশ্নভিত্তিক সঠিক উত্তরের ব্যাখ্যা" : "Question-Specific Explanation"}</span>
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ""}
                          onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                          placeholder={
                            language === "bn"
                              ? "সঠিক উত্তরের বৈজ্ঞানিক/তথ্যগত যুক্তি এবং অন্যান্য অপশন কেন ভুল তার ব্যাখ্যা..."
                              : "Explain why the correct answer is factually/conceptually true and why others are wrong..."
                          }
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            disabled={isSubmitting}
          >
            {t("cancel", "Cancel")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="create-quiz-form"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{language === "bn" ? "কুইজ প্রকাশ করা হচ্ছে..." : "Publishing Quiz..."}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>
                    {language === "bn" ? "কুইজ প্রকাশ করুন" : "Publish Quiz"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
