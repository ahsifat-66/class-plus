"use client";

import React from "react";
import { X, Award, Users, CheckCircle2 } from "lucide-react";

interface SubmissionItem {
  id: string;
  score: number;
  totalPoints: number;
  completedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

interface QuizSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  submissions: SubmissionItem[];
  totalPoints: number;
}

export default function QuizSubmissionsModal({
  isOpen,
  onClose,
  quizTitle,
  submissions,
  totalPoints,
}: QuizSubmissionsModalProps) {
  if (!isOpen) return null;

  const averageScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
        )
      : 0;

  const averagePercentage =
    totalPoints > 0 ? Math.round((averageScore / totalPoints) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award size={20} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {quizTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {submissions.length} Student Submission{submissions.length === 1 ? "" : "s"} • Class Avg: {averageScore}/{totalPoints} ({averagePercentage}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Submissions List */}
        <div className="p-5 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {submissions.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Users size={20} strokeWidth={1.75} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No submissions received yet
              </p>
              <p className="text-[11px] text-slate-400">
                As soon as students complete this auto-graded quiz, their grades will appear here.
              </p>
            </div>
          ) : (
            submissions.map((sub) => {
              const pct = sub.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : 0;
              return (
                <div
                  key={sub.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {sub.user.avatar ? (
                      <img
                        src={sub.user.avatar}
                        alt={sub.user.name}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-indigo-200 dark:ring-indigo-800">
                        {sub.user.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {sub.user.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {sub.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {sub.score} / {sub.totalPoints}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pct >= 60
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sub.completedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
