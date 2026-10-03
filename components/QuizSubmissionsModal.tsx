"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Lightbulb,
  Check,
} from "lucide-react";

export interface QuestionItem {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string | null;
}

export interface SubmissionItem {
  id: string;
  score: number;
  totalPoints: number;
  completedAt: string;
  selectedAnswers?: number[];
  user: {
    id: string;
    uniqueId?: string | null;
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
  questions?: QuestionItem[];
  totalPoints: number;
}

export default function QuizSubmissionsModal({
  isOpen,
  onClose,
  quizTitle,
  submissions,
  questions = [],
  totalPoints,
}: QuizSubmissionsModalProps) {
  const [selectedStudentSubmission, setSelectedStudentSubmission] =
    useState<SubmissionItem | null>(null);

  // Reset selected student when modal closes or submissions change
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudentSubmission(null);
    }
  }, [isOpen]);

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
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* VIEW 1: Submissions Overview Header */}
        {!selectedStudentSubmission ? (
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
                  {submissions.length} Student Submission
                  {submissions.length === 1 ? "" : "s"} • Class Avg: {averageScore}/
                  {totalPoints} ({averagePercentage}%)
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
        ) : (
          /* VIEW 2: Student Breakdown Header */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-850">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedStudentSubmission(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Back to Submissions</span>
              </button>

              <div className="flex items-center gap-2.5 min-w-0">
                {selectedStudentSubmission.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedStudentSubmission.user.avatar}
                    alt={selectedStudentSubmission.user.name}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-indigo-200 dark:ring-indigo-800">
                    {selectedStudentSubmission.user.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedStudentSubmission.user.name}
                    </h4>
                    {selectedStudentSubmission.user.uniqueId && (
                      <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md shrink-0">
                        {selectedStudentSubmission.user.uniqueId}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {selectedStudentSubmission.user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Score: {selectedStudentSubmission.score} / {selectedStudentSubmission.totalPoints}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    (selectedStudentSubmission.score /
                      (selectedStudentSubmission.totalPoints || 1)) *
                      100 >=
                    60
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {Math.round(
                    (selectedStudentSubmission.score /
                      (selectedStudentSubmission.totalPoints || 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* VIEW 1: Submissions List */}
          {!selectedStudentSubmission ? (
            submissions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Users size={20} strokeWidth={1.75} />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No submissions received yet
                </p>
                <p className="text-[11px] text-slate-400">
                  As soon as students complete this auto-graded quiz, their answer sheets will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map((sub) => {
                  const pct =
                    sub.totalPoints > 0
                      ? Math.round((sub.score / sub.totalPoints) * 100)
                      : 0;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedStudentSubmission(sub)}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-3 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {sub.user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.user.avatar}
                            alt={sub.user.name}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-indigo-200 dark:ring-indigo-800">
                            {sub.user.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {sub.user.name}
                            </h4>
                            {sub.user.uniqueId && (
                              <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md shrink-0">
                                {sub.user.uniqueId}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {sub.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center gap-1.5 sm:justify-end">
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

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentSubmission(sub);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold transition-all shadow-sm group-hover:scale-105"
                        >
                          <span>View Answers</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* VIEW 2: Detailed Student Submission Breakdown */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Question-by-Question Answer Sheet Breakdown
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {questions.length} Questions Evaluated
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No question metadata available for this quiz.
                </div>
              ) : (
                questions.map((q, qIdx) => {
                  const studentAns =
                    selectedStudentSubmission.selectedAnswers?.[qIdx] ?? -1;
                  const correctAns = Number(q.correctOptionIndex);
                  const isAnswered = studentAns >= 0;
                  const isCorrect = isAnswered && studentAns === correctAns;

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 ${
                        isCorrect
                          ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      }`}
                    >
                      {/* Question Header & Point / Correctness Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                            Q{qIdx + 1}.
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {q.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {q.points} {q.points === 1 ? "point" : "points"}
                          </span>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={13} />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                              <XCircle size={13} />
                              <span>{isAnswered ? "Incorrect" : "Unanswered"}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isStudentChoice = studentAns === optIdx;
                          const isThisCorrect = correctAns === optIdx;

                          let cardStyle =
                            "border-slate-100 dark:border-slate-800 bg-transparent opacity-60";

                          if (isThisCorrect) {
                            cardStyle =
                              "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500";
                          } else if (isStudentChoice && !isThisCorrect) {
                            cardStyle =
                              "border-rose-400 bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 font-semibold ring-1 ring-rose-400";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${cardStyle}`}
                            >
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-xl text-xs font-bold font-mono shrink-0 ${
                                  isThisCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isStudentChoice
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>

                              <span className="text-xs font-medium leading-relaxed flex-1">
                                {opt}
                              </span>

                              {isThisCorrect && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                                  <Check size={12} strokeWidth={2.5} />
                                  <span>Answer Key</span>
                                </div>
                              )}

                              {isStudentChoice && !isThisCorrect && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full shrink-0">
                                  <XCircle size={12} />
                                  <span>Student Selected</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Box */}
                      {q.explanation && (
                        <div className="mt-2.5 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200">
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                            <Lightbulb size={14} className="text-amber-500 shrink-0" />
                            <span>ব্যাখ্যা (Explanation & Logic):</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex items-center justify-between shrink-0">
          {selectedStudentSubmission ? (
            <button
              type="button"
              onClick={() => setSelectedStudentSubmission(null)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Submissions</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              Click any student row to inspect their full answer sheet.
            </div>
          )}

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
