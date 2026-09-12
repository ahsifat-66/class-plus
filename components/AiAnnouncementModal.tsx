"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Send,
  AlertCircle,
  Check,
  Bot,
  RefreshCw,
  Flame,
  HeartHandshake,
  GraduationCap,
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface AiAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classNameTitle: string;
  onAnnouncementPosted: () => void;
}

type ToneType = "urgent" | "supportive" | "formal";

export default function AiAnnouncementModal({
  isOpen,
  onClose,
  classroomId,
  classNameTitle,
  onAnnouncementPosted,
}: AiAnnouncementModalProps) {
  const { currentUser } = useUser();
  const [notes, setNotes] = useState(
    "Exam moved to Monday, chapters 1-3, bring calculator, formula sheet provided"
  );
  const [tone, setTone] = useState<ToneType>("urgent");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  // Generated draft
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generationSource, setGenerationSource] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError("Please enter your rough notes or key bullet points.");
      return;
    }

    try {
      setIsGenerating(true);
      setError("");

      const res = await fetch("/api/ai/announcement-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim(),
          tone,
          className: classNameTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate announcement");
      }

      const data = await res.json();
      setGeneratedTitle(data.title);
      setGeneratedContent(data.content);
      setGenerationSource(data.source);
    } catch (err: any) {
      setError(err.message || "Something went wrong while generating.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!generatedTitle.trim() || !generatedContent.trim()) {
      setError("Please generate or edit an announcement first.");
      return;
    }

    try {
      setIsPosting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedTitle.trim(),
          content: generatedContent.trim(),
          authorId: currentUser?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish announcement");
      }

      onAnnouncementPosted();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to publish announcement.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  AI Announcement Copilot
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="h-3 w-3" />
                  Gemini-Powered
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transform rough notes into structured Markdown announcements with automated FAQs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <div className="mt-5 space-y-4">
          {/* Notes Input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Teacher's Rough Notes / Key Updates
              </label>
              <span className="text-[11px] text-slate-400">
                Jot down points casually
              </span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Exam moved to Monday, chapters 1-3, bring calculator, formula sheet provided..."
              className="mt-1.5 w-full rounded-2xl border border-slate-300 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Tone
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTone("urgent")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  tone === "urgent"
                    ? "border-rose-500 bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Flame className="h-4 w-4 text-rose-500" />
                <span>Urgent 🚨</span>
              </button>

              <button
                type="button"
                onClick={() => setTone("supportive")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  tone === "supportive"
                    ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <HeartHandshake className="h-4 w-4 text-amber-500" />
                <span>Supportive 🌟</span>
              </button>

              <button
                type="button"
                onClick={() => setTone("formal")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                  tone === "formal"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                <span>Formal 🎓</span>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-98 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Drafting Announcement...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Announcement</span>
                </>
              )}
            </button>
          </div>

          {/* Live Preview / Editable Area */}
          {(generatedTitle || generatedContent) && (
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Announcement Preview & Markdown Editor
                </span>
                {generationSource && (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                    Source: {generationSource}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Content (Formatted Markdown with Auto-Generated FAQs)
                </label>
                <textarea
                  rows={8}
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="w-full font-mono text-xs rounded-2xl border border-slate-300 p-3.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Publish directly to Class Stream */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Will be posted to class stream as Dr. Kamal Hossain
                </span>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={isPosting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-98 disabled:opacity-60"
                >
                  {isPosting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Post Announcement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
