"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Lightbulb,
  Bug,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryType = "suggestion" | "bug" | "general";

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { currentUser } = useUser();
  const [category, setCategory] = useState<CategoryType>("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setCategory("suggestion");
      setErrorMessage(null);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage("অনুগ্রহ করে আপনার মূল্যবান মতামত বা সমস্যার বিবরণ লিখুন।");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "guest",
          userName: currentUser?.name || "Anonymous User",
          userEmail: currentUser?.email || "N/A",
          uniqueId: currentUser?.uniqueId || "N/A",
          userRole: currentUser?.role || "student",
          category: category || "general",
          message: trimmed,
          status: "new",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        setMessage("");
        // Notify other components/tabs in real-time
        try {
          window.dispatchEvent(new CustomEvent("feedback-submitted", { detail: data.feedback }));
          localStorage.setItem("classpulse_last_feedback", Date.now().toString());
        } catch (e) {
          // ignore
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMessage(data.error || "ফিডব্যাক পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      }
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setErrorMessage("ফিডব্যাক পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Top Accent Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Send Feedback / মতামত পাঠান
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Help us improve ClassPulse with your thoughts & reports
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all active:scale-95 disabled:opacity-50"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Success Banner */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  মতামত গৃহীত হয়েছে!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  ধন্যবাদ! আপনার মতামত সফলভাবে অ্যাডমিনের কাছে পাঠানো হয়েছে।
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 flex items-center gap-2.5 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-in fade-in">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Category Selection Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Feedback Category (ধরণ নির্বাচন করুন):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Suggestion */}
                  <button
                    type="button"
                    onClick={() => setCategory("suggestion")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      category === "suggestion"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <Lightbulb size={15} className="text-amber-500 shrink-0" />
                    <span>Suggestion (পরামর্শ)</span>
                  </button>

                  {/* Bug Report */}
                  <button
                    type="button"
                    onClick={() => setCategory("bug")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      category === "bug"
                        ? "bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <Bug size={15} className="text-rose-500 shrink-0" />
                    <span>Bug Report (সমস্যা)</span>
                  </button>

                  {/* General */}
                  <button
                    type="button"
                    onClick={() => setCategory("general")}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      category === "general"
                        ? "bg-teal-50 dark:bg-teal-950/60 border-teal-400 dark:border-teal-600 text-teal-700 dark:text-teal-300 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    <Star size={15} className="text-teal-500 shrink-0" />
                    <span>General (সাধারণ)</span>
                  </button>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Feedback / আপনার বক্তব্য:
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      message.trim().length > 0
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {message.trim().length} chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার মূল্যবান মতামত বা সমস্যার বিবরণ লিখুন..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              {/* User Identity Note */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  Submitting as:{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {currentUser?.name || "Student"}
                  </strong>
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {currentUser?.uniqueId || "ClassPulse Member"}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>পাঠানো হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>জমা দিন (Submit)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
