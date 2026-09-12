"use client";

import React, { useState } from "react";
import { X, Send, CheckCircle2, Award, MessageSquare } from "lucide-react";
import { useUser } from "@/context/UserContext";

interface AssignmentSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    description: string;
    maxPoints: number;
    submissions?: Array<{
      id: string;
      content: string;
      grade: number | null;
      feedback: string | null;
      studentId: string;
    }>;
  } | null;
  onSubmitted: () => void;
}

export default function AssignmentSubmitModal({
  isOpen,
  onClose,
  assignment,
  onSubmitted,
}: AssignmentSubmitModalProps) {
  const { currentUser } = useUser();
  const existingSubmission = assignment?.submissions?.find(
    (s) => s.studentId === currentUser?.id
  );

  const [content, setContent] = useState(existingSubmission?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write or paste your solution/SQL code.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser?.id,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit assignment");
      }

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Assignment Submission
            </span>
            <h3 className="text-lg font-bold text-slate-900">{assignment.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Grade / Feedback Banner if Graded */}
        {existingSubmission && existingSubmission.grade !== null && (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>Graded by Instructor</span>
              </div>
              <span className="rounded-xl bg-emerald-600 text-white font-bold px-3 py-1 text-sm shadow-sm">
                {existingSubmission.grade} / {assignment.maxPoints} pts
              </span>
            </div>
            {existingSubmission.feedback && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 text-xs text-emerald-900">
                <span className="font-semibold">Teacher's Feedback: </span>
                {existingSubmission.feedback}
              </div>
            )}
          </div>
        )}

        {/* Assignment Description */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Prompt Instructions
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Your Answer / Query Solution
              </label>
              <span className="text-[11px] text-slate-400">
                Markdown & Code blocks supported
              </span>
            </div>
            <textarea
              rows={8}
              placeholder="Paste your SQL statements, execution plan analysis, or problem response..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full font-mono text-xs rounded-2xl border border-slate-300 p-3.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{existingSubmission ? "Update Submission" : "Submit Assignment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
