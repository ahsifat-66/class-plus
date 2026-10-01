"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  BookOpen,
  Lightbulb,
  FileText,
  RefreshCw,
  Info,
  GraduationCap,
  BookMarked,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import MarkdownViewer from "@/components/MarkdownViewer";
import PdfReaderModal from "@/components/PdfReaderModal";
import { getCatalogBooksByGrade } from "@/lib/nctb-catalog";

interface StudentAiAssistantDrawerProps {
  initialContext?: string;
  classroomContext?: string;
  noteTitle?: string;
  buttonPositionClass?: string;
}

type AssistantMode = "explain" | "quiz" | "hint";
type LanguageChoice = "bn" | "en";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AssistantMode;
  timestamp: Date;
  source?: string;
  gradeLevel?: string;
}

const ALL_NCTB_GRADES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

// Helper to deduce initial grade from classroom or user
function deduceInitialGrade(context?: string, userGrade?: string | null): string {
  const combined = `${context || ""} ${userGrade || ""}`.toLowerCase();
  for (let i = 12; i >= 1; i--) {
    if (
      combined.includes(`class ${i}`) ||
      combined.includes(`grade ${i}`) ||
      combined.includes(`class-${i}`) ||
      combined.includes(`${i}th`)
    ) {
      return `Class ${i}`;
    }
  }
  if (combined.includes("hsc") || combined.includes("college")) return "Class 12";
  if (combined.includes("ssc") || combined.includes("দাখিল")) return "Class 10";
  if (combined.includes("primary") || combined.includes("প্রাথমিক")) return "Class 5";
  return "Class 8";
}

function getDynamicQuickQuestions(
  grade: string,
  context?: string,
  language: "bn" | "en" = "bn"
): string[] {
  const combined = `${context || ""}`.toLowerCase();

  // ONLY show SQL / DBMS questions if explicitly Computer Science / DBMS / Software Engineering
  if (
    combined.includes("dbms") ||
    combined.includes("database") ||
    combined.includes("sql") ||
    combined.includes("computer science") ||
    combined.includes("software engineering")
  ) {
    return language === "bn"
      ? [
          "ডাটাবেজে LEFT JOIN এবং INNER JOIN এর পার্থক্য কী?",
          "ডাটাবেজে ইনডেক্সিং কীভাবে কুয়েরির গতি বাড়ায়?",
          "ডাটাবেজ নরমালাইজেশনের মূল উদ্দেশ্য কী?",
        ]
      : [
          "When should I use LEFT JOIN vs INNER JOIN in SQL?",
          "How does indexing improve query retrieval speed?",
          "What is the principle of Database Normalization?",
        ];
  }

  // Determine grade number
  let gradeNum: number | null = null;
  const match = grade.match(/\d{1,2}/);
  if (match) gradeNum = parseInt(match[0], 10);

  // Secondary / SSC (Class 9-10)
  if (gradeNum === 9 || gradeNum === 10) {
    return language === "bn"
      ? [
          "নিউটনের গতির দ্বিতীয় সূত্রটি ব্যাখ্যা করো",
          "মৌলের যোজনী কীভাবে বের করে?",
          "ত্রিকোণমিতিক অভেদাবলি মনে রাখার সহজ উপায় কী?",
        ]
      : [
          "Explain Newton's Second Law of Motion conceptually",
          "How do I determine the valency of an element?",
          "What is an easy way to remember trigonometric identities?",
        ];
  }

  // College / HSC (Class 11-12)
  if (gradeNum && gradeNum >= 11) {
    return language === "bn"
      ? [
          "ক্যালকুলাসে অন্তরীকরণ ও যোগজীকরণের মৌলিক পার্থক্য কী?",
          "জারণ-বিজারণ বিক্রিয়া শনাক্ত করার সহজ নিয়ম কী?",
          "আইসিটিতে বাইনারি থেকে ডেসিমাল রূপান্তরের পদ্ধতি কী?",
        ]
      : [
          "What is the fundamental difference between differentiation and integration?",
          "How do I balance oxidation-reduction reactions?",
          "How do I convert binary numbers to decimal in ICT?",
        ];
  }

  // Primary & Lower Secondary (Class 1–8) - Default
  return language === "bn"
    ? [
        "উদ্ভিদ কীভাবে নিজের খাদ্য তৈরি করে?",
        "লসাগু ও গসাগু নির্ণয়ের সহজ নিয়ম কী?",
        "কম্পিউটারের ইনপুট ও আউটপুট ডিভাইসের পার্থক্য কী?",
      ]
    : [
        "How do plants produce their own food?",
        "What is an easy method to calculate LCM and GCD?",
        "What is the difference between input and output devices?",
      ];
}

export default function StudentAiAssistantDrawer({
  initialContext,
  classroomContext,
  noteTitle,
  buttonPositionClass = "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4",
}: StudentAiAssistantDrawerProps) {
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<AssistantMode>("explain");
  const [customContext, setCustomContext] = useState<string>(initialContext || "");
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // Bangladesh NCTB Grade Level state (Class 1 to Class 12)
  const [selectedGrade, setSelectedGrade] = useState<string>(() =>
    deduceInitialGrade(classroomContext, currentUser?.grade)
  );

  const [showBooksList, setShowBooksList] = useState(false);
  const [readingBook, setReadingBook] = useState<{
    title: string;
    driveUrl: string;
    grade?: string;
    subject?: string;
  } | null>(null);

  const gradeBooks = React.useMemo(() => {
    return getCatalogBooksByGrade(selectedGrade);
  }, [selectedGrade]);

  // Dual-Language Support (Bangla & English) with localStorage persistence
  const [language, setLanguage] = useState<LanguageChoice>("bn");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("classpulse_ai_language");
      if (savedLang === "bn" || savedLang === "en") {
        setLanguage(savedLang);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLanguageChange = (newLang: LanguageChoice) => {
    setLanguage(newLang);
    try {
      localStorage.setItem("classpulse_ai_language", newLang);
    } catch {
      // ignore
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getGreeting = () => {
    const studentName = currentUser?.name ? currentUser.name.split(" ")[0] : "";
    if (language === "bn") {
      return `স্বাগতম ${
        studentName || "শিক্ষার্থী"
      }! আমি তোমার NCTB একাডেমিক এআই টিউটর (${selectedGrade})।\n\nপাঠ্যবইয়ের যেকোনো অধ্যায়, সমীকরণ বা বিষয়ের ওপর নির্ভয়ে প্রশ্ন করো। সরাসরি উত্তরের বদলে ধাপে ধাপে তোমাকে বুঝিয়ে দেব। নিচে দেওয়া যেকোনো বাটনে চাপ দিয়ে শুরু করতে পারো।`;
    }
    return `Hello ${
      studentName || "Student"
    }! I am your Socratic AI Academic Tutor for ${selectedGrade}.\n\nAsk any question about your NCTB textbook topics, equations, or problems. I will guide you step-by-step with conceptual hints without spoiling direct answers.`;
  };

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: getGreeting(),
      timestamp: new Date(),
    },
  ]);

  // Update initial greeting if language or grade changes and chat is fresh
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "initial-welcome") {
        return [
          {
            id: "initial-welcome",
            role: "assistant",
            content: getGreeting(),
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
  }, [language, selectedGrade]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Keep customContext updated if initialContext changes
  useEffect(() => {
    if (initialContext) {
      setCustomContext(initialContext);
    }
  }, [initialContext]);

  // If classroomContext changes, deduce grade
  useEffect(() => {
    if (classroomContext) {
      setSelectedGrade(deduceInitialGrade(classroomContext, currentUser?.grade));
    }
  }, [classroomContext, currentUser?.grade]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY > 80) {
        setIsOpen(false);
      }
      setTouchStartY(null);
    }
  };

  const handleSend = async (queryText?: string, overrideMode?: AssistantMode) => {
    const textToSend = queryText || input;
    const modeToSend = overrideMode || activeMode;

    if (!textToSend.trim() || isLoading) return;

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      mode: modeToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const activeContextText = customContext.trim()
        ? customContext.trim()
        : classroomContext || (noteTitle ? `Study Note: ${noteTitle}` : undefined);

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          context: activeContextText,
          mode: modeToSend,
          role: "STUDENT",
          gradeLevel: selectedGrade,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate academic response");
      }

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data.reply ||
          (language === "bn"
            ? "আমি তোমার প্রশ্নটি বিশ্লেষণ করেছি। চলো ধাপে ধাপে মূল বিষয়টি বুঝি।"
            : "I have analyzed your inquiry. Let's explore the underlying principles step-by-step."),
        mode: modeToSend,
        timestamp: new Date(),
        source: data.source,
        gradeLevel: data.gradeLevel || selectedGrade,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            language === "bn"
              ? "সাময়িক সংযোগ ত্রুটি হয়েছে। তোমার প্রশ্নের মূল সূত্র বা অধ্যায়টির নাম আবার লিখে জানাও।"
              : "A temporary connection variance occurred. What foundational principle or formula is at the core of your question?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = React.useMemo(
    () => getDynamicQuickQuestions(selectedGrade, classroomContext || noteTitle, language),
    [selectedGrade, classroomContext, noteTitle, language]
  );

  const quickActionChips =
    language === "bn"
      ? [
          {
            label: "ধারণাটি বুঝিয়ে দাও",
            mode: "explain" as AssistantMode,
            icon: BookOpen,
            defaultPrompt: noteTitle
              ? `"${noteTitle}" অধ্যায়ের মূল ধারণাগুলো সহজ ভাষায় ধাপে ধাপে বুঝিয়ে দাও।`
              : `${selectedGrade} NCTB পাঠ্যবই অনুযায়ী এই বিষয়টির মূল ধারণা সহজ ভাষায় ধাপে ধাপে বুঝিয়ে দাও।`,
          },
          {
            label: "কুইজ দিয়ে পরীক্ষা নাও",
            mode: "quiz" as AssistantMode,
            icon: HelpCircle,
            defaultPrompt: noteTitle
              ? `"${noteTitle}" অধ্যায়ের ওপর কয়েকটি বহুনির্বাচনী কুইজ প্রশ্ন দাও।`
              : `${selectedGrade} NCTB বোর্ড পরীক্ষার মানদণ্ডে কয়েকটি বহুনির্বাচনী প্রশ্ন দিয়ে আমার ধারণা যাচাই করো।`,
          },
          {
            label: "প্রয়োজনীয় সূত্র ও নিয়ম",
            mode: "hint" as AssistantMode,
            icon: Lightbulb,
            defaultPrompt: noteTitle
              ? `"${noteTitle}" অধ্যায়ের মূল সূত্র ও গুরুত্বপূর্ণ নিয়মগুলো কী কী?`
              : `${selectedGrade} এর এই পাঠের প্রধান সূত্র ও সমাধান করার নিয়মগুলো বুঝিয়ে দাও।`,
          },
        ]
      : [
          {
            label: "Explain this concept",
            mode: "explain" as AssistantMode,
            icon: BookOpen,
            defaultPrompt: noteTitle
              ? `Can you explain the core concepts of "${noteTitle}" step-by-step for ${selectedGrade}?`
              : `Can you explain the main theoretical principles of this topic step-by-step for ${selectedGrade}?`,
          },
          {
            label: "Quiz me on this topic",
            mode: "quiz" as AssistantMode,
            icon: HelpCircle,
            defaultPrompt: noteTitle
              ? `Quiz me on "${noteTitle}" with NCTB multiple-choice questions to test my recall.`
              : `Quiz me on this topic with ${selectedGrade} NCTB standard multiple-choice questions.`,
          },
          {
            label: "Summarize key formulas",
            mode: "hint" as AssistantMode,
            icon: Lightbulb,
            defaultPrompt: noteTitle
              ? `What are the key formulas and core rules in "${noteTitle}"?`
              : `What are the key formulas and core rules for this ${selectedGrade} topic?`,
          },
        ];

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Academic Tutor"
          className={`fixed ${buttonPositionClass} z-50 flex items-center gap-2.5 rounded-full bg-slate-900 dark:bg-indigo-600 text-white px-4 py-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-700/50 dark:border-indigo-400/40 min-h-[48px] min-w-[48px]`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/30 text-amber-300">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight tracking-wide">
              {language === "bn" ? "NCTB এআই টিউটর" : "NCTB AI Tutor"}
            </span>
            <span className="text-[10px] text-slate-300 dark:text-indigo-200 font-medium">
              {selectedGrade}
            </span>
          </div>
        </button>
      )}

      {/* Slide-Up Bottom Sheet on Mobile / Slide-In Drawer on Desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full sm:w-[480px] h-[90vh] sm:h-full rounded-t-[28px] sm:rounded-none bg-white dark:bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-250">
            {/* Mobile Drag Dismiss Bar */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="sm:hidden flex justify-center py-2.5 cursor-grab active:cursor-grabbing shrink-0"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {language === "bn" ? "NCTB এআই টিউটর" : "Socratic AI Tutor"}
                    </h3>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800">
                      NCTB 1-12
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                    {classroomContext || noteTitle || "Bangladesh National Curriculum"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowContextEditor(!showContextEditor)}
                  title="Configure study context"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Assistant"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Grade Selector & Dual-Language Toggle Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
              {/* NCTB Grade Selector Dropdown */}
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={1.75} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {language === "bn" ? "শ্রেণি:" : "Grade:"}
                </span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {ALL_NCTB_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowBooksList(!showBooksList)}
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors ml-1"
                  title="View Recommended Textbooks"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "বইসমূহ" : "Books"} ({gradeBooks.length})</span>
                  {showBooksList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Minimalist Language Switcher */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300/80 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("bn")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    language === "bn"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    language === "en"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Socratic Philosophy Notice */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/50 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 shrink-0">
              <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
              <span>
                {language === "bn" ? (
                  <>
                    <strong>NCTB গাইডেন্স:</strong> সরাসরি হোমওয়ার্ক সমাধান নয়, বরং ধাপে ধাপে যুক্তিপূর্ণ সংকেত ও ধারণা দেওয়া হবে।
                  </>
                ) : (
                  <>
                    <strong>Socratic Policy:</strong> Step-by-step conceptual hints without direct homework solutions.
                  </>
                )}
              </span>
            </div>

            {/* Collapsible Recommended Textbooks Panel */}
            {showBooksList && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 shrink-0 max-h-60 overflow-y-auto space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <BookMarked className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {selectedGrade}{" "}
                      {language === "bn" ? "সুপারিশকৃত পাঠ্যবইসমূহ" : "Recommended Textbooks"} ({gradeBooks.length})
                    </span>
                  </span>
                  <button
                    onClick={() => setShowBooksList(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                  >
                    {language === "bn" ? "বন্ধ করুন" : "Close"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {gradeBooks.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs shadow-2xs"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                          {b.subject}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate block text-[11px]">
                          {b.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setReadingBook({
                              title: b.title,
                              driveUrl: b.driveUrl,
                              grade: b.grade,
                              subject: b.subject,
                            })
                          }
                          className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                          title="Read Online"
                        >
                          {language === "bn" ? "পড়ুন" : "Read"}
                        </button>
                        <a
                          href={b.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Reference Context Box */}
            {showContextEditor && (
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {language === "bn" ? "পাঠ্যবিষয় বা রেফারেন্স নোট" : "Active Study Context"}
                  </label>
                  <button
                    onClick={() => setCustomContext("")}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {language === "bn" ? "মুছে ফেলো" : "Clear Context"}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "অধ্যায়ের নাম, কোনো উপপাদ্য, সূত্র বা প্রশ্ন এখানে পেস্ট করতে পারো..."
                      : "Paste chapter topic, theorem, equation, or assignment prompt here..."
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700"
                    }`}
                  >
                    {m.role === "user" ? (
                      currentUser?.name?.slice(0, 1) || "S"
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                    )}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed max-w-[85%] shadow-sm ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white whitespace-pre-wrap"
                        : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div>
                        <MarkdownViewer content={m.content} />
                        {m.source && (
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                            <span>NCTB: {m.gradeLevel || selectedGrade}</span>
                            <span>Model: {m.source}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {language === "bn"
                        ? "NCTB পাঠ্যবই অনুযায়ী বিশ্লেষণ করা হচ্ছে..."
                        : "Formulating NCTB syllabus guidance..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Mode Chips */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickActionChips.map((chip, idx) => {
                  const Icon = chip.icon;
                  const isActive = activeMode === chip.mode;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveMode(chip.mode);
                        handleSend(chip.defaultPrompt, chip.mode);
                      }}
                      disabled={isLoading}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shrink-0 min-h-[36px] ${
                        isActive
                           ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                           : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Grade-Appropriate Quick Questions */}
            <div className="px-4 py-1.5 border-t border-slate-100/80 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q, "explain")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-700 shrink-0 min-h-[32px]"
                  >
                    <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" strokeWidth={1.75} />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "প্রশ্নটি বাংলায় লেখো (যেমন: ভগ্নাংশ কীভাবে যোগ করব?)..."
                      : "Ask your question (e.g. How do I solve quadratic equations?)..."
                  }
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send Message"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 shrink-0"
                >
                  <Send className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <PdfReaderModal
        isOpen={!!readingBook}
        onClose={() => setReadingBook(null)}
        title={readingBook?.title || ""}
        pdfUrl={readingBook?.driveUrl || ""}
        grade={readingBook?.grade}
        subject={readingBook?.subject}
      />
    </>
  );
}
