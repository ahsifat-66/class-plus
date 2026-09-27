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
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import MarkdownViewer from "@/components/MarkdownViewer";

interface StudentAiAssistantDrawerProps {
  initialContext?: string;
  classroomContext?: string;
  noteTitle?: string;
  buttonPositionClass?: string;
}

type AssistantMode = "explain" | "quiz" | "hint";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AssistantMode;
  timestamp: Date;
  source?: string;
}

export default function StudentAiAssistantDrawer({
  initialContext,
  classroomContext,
  noteTitle,
  buttonPositionClass = "bottom-20 md:bottom-6 right-5",
}: StudentAiAssistantDrawerProps) {
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<AssistantMode>("explain");
  const [customContext, setCustomContext] = useState<string>(initialContext || "");
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultGreeting = `Hello ${
    currentUser?.name ? currentUser.name.split(" ")[0] : "Student"
  }! I am your Socratic AI Academic Tutor${
    classroomContext ? ` for ${classroomContext}` : ""
  }.\n\nI will help guide you step-by-step through complex concepts, formulas, and problem-solving without spoiling direct homework answers. Select a quick action chip or ask any question to get started.`;

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: defaultGreeting,
      timestamp: new Date(),
    },
  ]);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate academic response");
      }

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I have analyzed your inquiry. Let's explore the underlying principles.",
        mode: modeToSend,
        timestamp: new Date(),
        source: data.source,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "A temporary connection variance occurred. What foundational principle or formula is at the core of your question?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActionChips = [
    {
      label: "Explain this concept",
      mode: "explain" as AssistantMode,
      icon: BookOpen,
      defaultPrompt: noteTitle
        ? `Can you explain the core concepts of "${noteTitle}" step-by-step?`
        : "Can you explain the main theoretical principles of this topic step-by-step?",
    },
    {
      label: "Quiz me on this topic",
      mode: "quiz" as AssistantMode,
      icon: HelpCircle,
      defaultPrompt: noteTitle
        ? `Quiz me on "${noteTitle}" with multiple-choice questions to test my recall.`
        : "Quiz me on this topic with multiple-choice questions to test my recall.",
    },
    {
      label: "Summarize key formulas",
      mode: "hint" as AssistantMode,
      icon: Lightbulb,
      defaultPrompt: noteTitle
        ? `What are the key formulas and invariant relationships in "${noteTitle}"?`
        : "What are the key formulas and invariant relationships in this topic?",
    },
  ];

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Academic Tutor"
          className={`fixed ${buttonPositionClass} z-40 flex items-center gap-2.5 rounded-full bg-slate-900 dark:bg-indigo-600 text-white px-4 py-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-700/50 dark:border-indigo-400/40 min-h-[48px]`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/30 text-amber-300">
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight tracking-wide">
              AI Academic Tutor
            </span>
            <span className="text-[10px] text-slate-300 dark:text-indigo-200 font-medium">
              Socratic Guidance
            </span>
          </div>
        </button>
      )}

      {/* Slide-Up Bottom Sheet on Mobile / Slide-In Drawer on Desktop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full sm:w-[460px] h-[90vh] sm:h-full rounded-t-[28px] sm:rounded-none bg-white dark:bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-250">
            {/* Mobile Drag Dismiss Bar */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="sm:hidden flex justify-center py-2.5 cursor-grab active:cursor-grabbing shrink-0"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Socratic AI Tutor
                    </h3>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800">
                      Dual-Role Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                    {classroomContext || noteTitle || "Guided Socratic Learning"}
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

            {/* Socratic Philosophy Notice */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/50 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 shrink-0">
              <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.75} />
              <span>
                <strong>Socratic Policy:</strong> Step-by-step conceptual hints without direct homework solutions.
              </span>
            </div>

            {/* Collapsible Reference Context Box */}
            {showContextEditor && (
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Active Study Context
                  </label>
                  <button
                    onClick={() => setCustomContext("")}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear Context
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Paste excerpt, assignment prompt, or formula sheet here..."
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
                          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[10px] text-slate-400 font-mono">
                            Model: {m.source}
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
                    <span>Formulating step-by-step Socratic guidance...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 shrink-0">
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
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shrink-0 min-h-[38px] ${
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
                  placeholder="Ask a question or explain your reasoning..."
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
    </>
  );
}
