"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Loader2,
  Check,
  RotateCcw,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
}

interface QuizSubmission {
  id: string;
  score: number;
  totalPoints: number;
  selectedAnswers: number[];
  completedAt: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimitMinutes: number;
  questions: Question[];
  mySubmission?: QuizSubmission | null;
}

interface QuizTakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  quiz: Quiz | null;
  onSubmitted: () => void;
}

export default function QuizTakingModal({
  isOpen,
  onClose,
  classroomId,
  quiz,
  onSubmitted,
}: QuizTakingModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const isAutoSubmitting = useRef(false);

  // Initialize or restore state when quiz changes
  useEffect(() => {
    if (quiz) {
      if (quiz.mySubmission) {
        // Already submitted; show result mode directly
        setResult({
          score: quiz.mySubmission.score,
          totalPoints: quiz.mySubmission.totalPoints,
          percentage:
            quiz.mySubmission.totalPoints > 0
              ? Math.round((quiz.mySubmission.score / quiz.mySubmission.totalPoints) * 100)
              : 0,
          selectedAnswers: quiz.mySubmission.selectedAnswers,
        });
      } else {
        setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
        setSecondsRemaining(quiz.timeLimitMinutes * 60);
        setResult(null);
        isAutoSubmitting.current = false;
      }
    }
  }, [quiz]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || result || !quiz || quiz.mySubmission) return;

    if (secondsRemaining <= 0) {
      if (!isAutoSubmitting.current) {
        isAutoSubmitting.current = true;
        handleSubmitQuiz();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining, result, quiz]);

  if (!isOpen || !quiz) return null;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quiz.");
      }

      setResult(data);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl my-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Countdown Bar / Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-850">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {quiz.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {quiz.questions.length} Questions • {totalPoints} Total Points
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Countdown Badge (if active taking) */}
            {!result && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-mono text-xs sm:text-sm font-bold border transition-colors ${
                  secondsRemaining < 60
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400 animate-pulse"
                    : "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                }`}
              >
                <Clock size={16} />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Scrollable Questions or Results */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Result Card Banner */}
          {result && (
            <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 p-6 shadow-sm space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none">
                    <Award size={24} strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Auto-Graded Result
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                      {result.score} / {result.totalPoints || totalPoints} Points
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right sm:text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {result.percentage}%
                    </span>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {result.percentage >= 60 ? "Proficient Mastery" : "Review Recommended"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-emerald-100 dark:border-emerald-900/40 pt-3">
                Review your responses below. Correct answers and your selected choices are highlighted for academic study.
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-5">
            {quiz.questions.map((q, qIdx) => {
              const userSelected = result
                ? (result.review?.[qIdx]?.userSelected ?? result.selectedAnswers?.[qIdx] ?? selectedAnswers[qIdx])
                : selectedAnswers[qIdx];

              const correctIdx = result?.review?.[qIdx]?.correctOptionIndex ?? q.correctOptionIndex;
              const hasAnswerKey = correctIdx !== undefined && correctIdx !== null;
              const isCorrectAnswer = result ? userSelected === correctIdx : null;

              return (
                <div
                  key={q.id || qIdx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                    result
                      ? isCorrectAnswer
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                        Q{qIdx + 1}.
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {q.points} pt{q.points === 1 ? "" : "s"}
                      </span>
                      {result && (
                        isCorrectAnswer ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <XCircle size={12} />
                            <span>Incorrect</span>
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userSelected === optIdx;
                      const isThisCorrect = hasAnswerKey && correctIdx === optIdx;

                      let cardStyle = "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800";

                      if (result) {
                        if (isThisCorrect) {
                          cardStyle = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500";
                        } else if (isSelected && !isThisCorrect) {
                          cardStyle = "border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-semibold ring-1 ring-rose-400";
                        } else {
                          cardStyle = "border-slate-100 dark:border-slate-800 bg-transparent opacity-60";
                        }
                      } else if (isSelected) {
                        cardStyle = "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20";
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${cardStyle} ${
                            result ? "cursor-default" : "cursor-pointer"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-xl text-xs font-bold font-mono shrink-0 ${
                              isThisCorrect
                                ? "bg-emerald-600 text-white"
                                : isSelected && !isThisCorrect && result
                                ? "bg-rose-600 text-white"
                                : isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>

                          <span className="text-xs font-medium leading-relaxed flex-1">
                            {opt}
                          </span>

                          {isThisCorrect && (
                            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          {isSelected && !isThisCorrect && result && (
                            <XCircle size={16} className="text-rose-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 shrink-0">
          {!result ? (
            <>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Answered <strong className="text-slate-800 dark:text-slate-200">{answeredCount}</strong> of{" "}
                {quiz.questions.length} questions
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Save & Exit
                </button>
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Submit Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Close Review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
