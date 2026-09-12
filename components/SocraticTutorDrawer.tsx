"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  ChevronRight,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface SocraticTutorDrawerProps {
  classroomName: string;
  subject: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function SocraticTutorDrawer({
  classroomName,
  subject,
}: SocraticTutorDrawerProps) {
  const { currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-welcome",
      role: "assistant",
      content: `Hello ${currentUser?.name ? currentUser.name.split(" ")[0] : "there"}! I'm your Socratic Tutor for **${classroomName}**.\n\nI won't give you ready-made answers or code snippets. Instead, I'll provide guiding questions and conceptual hints to help you master the logic yourself. What problem or query are you working through right now?`,
      timestamp: new Date(),
    },
  ]);

  const quickPrompts = [
    "When should I use LEFT JOIN vs INNER JOIN in SQL?",
    "How does COALESCE handle NULL values in calculations?",
    "Why does a B+ Tree store all record pointers in leaf nodes?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText?: string) => {
    const text = questionText || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/socratic-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text.trim(),
          classroomContext: `${classroomName} (${subject})`,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: "assistant-" + Date.now(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "assistant",
          content:
            "I ran into a temporary hiccup connecting to the reasoning engine. What core concept is puzzling you right now?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 px-4 py-3 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 text-amber-300 animate-spin" style={{ animationDuration: "6s" }} />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-none">Socratic AI Tutor</span>
            <span className="text-[10px] text-teal-100 font-medium leading-tight">Guided logic hints</span>
          </div>
        </button>
      )}

      {/* Drawer Overlay & Sidebar */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-purple-50/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">Socratic AI Tutor</h3>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                    No Direct Spoilers
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                  Guided discovery for {classroomName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Socratic Philosophy Banner */}
          <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-[11px] text-amber-800">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Pedagogical Rule:</strong> Ask me about code or query logic and I'll give 1 step-by-step guiding hint at a time.
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-teal-500 text-white shadow-sm"
                  }`}
                >
                  {m.role === "user" ? (
                    currentUser?.name?.slice(0, 1) || "U"
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  )}
                </div>

                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed max-w-[82%] shadow-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 border border-slate-200/80 text-slate-800 whitespace-pre-wrap"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                </div>
                <div className="rounded-2xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px]">Formulating guiding question...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Chips */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Quick Socratic Questions
            </p>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p)}
                  disabled={isLoading}
                  className="text-left text-[11px] bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 rounded-xl px-2.5 py-1.5 transition-colors truncate"
                >
                  💡 {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white">
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
                placeholder="Ask for a guiding hint or explain your thought..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
