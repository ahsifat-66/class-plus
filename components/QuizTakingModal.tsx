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
  Lightbulb,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Question {
  id: string;
  question: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
  explanation?: string | null;
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
  mode?: "TAKE" | "REVIEW";
}

export default function QuizTakingModal({
  isOpen,
  onClose,
  classroomId,
  quiz,
  onSubmitted,
  mode = "TAKE",
}: QuizTakingModalProps) {
  const { language } = useLanguage();
  const [currentMode, setCurrentMode] = useState<"TAKE" | "REVIEW">(mode);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState("");
  const isAutoSubmitting = useRef(false);

  // Initialize or restore state when quiz or mode changes
  useEffect(() => {
    if (!isOpen || !quiz) {
      setHasStarted(false);
      setIsConfirmingSubmit(false);
      isAutoSubmitting.current = false;
      return;
    }

    const effectiveMode = mode || (quiz.mySubmission ? "REVIEW" : "TAKE");
    setCurrentMode(effectiveMode);

    if (effectiveMode === "REVIEW" && quiz.mySubmission) {
      // Review mode: student already submitted or reviewing
      setResult({
        score: quiz.mySubmission.score,
        totalPoints: quiz.mySubmission.totalPoints,
        percentage:
          quiz.mySubmission.totalPoints > 0
            ? Math.round((quiz.mySubmission.score / quiz.mySubmission.totalPoints) * 100)
            : 0,
        selectedAnswers: quiz.mySubmission.selectedAnswers || [],
      });
      setHasStarted(false);
      isAutoSubmitting.current = false;
    } else {
      // Quiz Taking mode: fresh start with valid timer
      setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
      const totalSecs = Math.max(1, (quiz.timeLimitMinutes || 15) * 60);
      setSecondsRemaining(totalSecs);
      setResult(null);
      setError("");
      isAutoSubmitting.current = false;
      setHasStarted(true);
    }
  }, [isOpen, quiz, mode]);

  // Countdown timer: strictly guarded against early auto-submission on mount
  useEffect(() => {
    // Only tick when modal is open, taking mode has started, no results yet, and not currently submitting
    if (!isOpen || !quiz || !hasStarted || result || isSubmitting) {
      return;
    }

    if (secondsRemaining <= 0) {
      // Auto-submit only when countdown actually hits 0
      if (!isAutoSubmitting.current) {
        isAutoSubmitting.current = true;
        handleSubmitQuiz(true);
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
  }, [isOpen, quiz, hasStarted, result, secondsRemaining, isSubmitting]);

  if (!isOpen || !quiz) return null;

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  };

  const handleSubmitQuiz = async (isAuto = false) => {
    if (isSubmitting || !quiz) return;

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
      setCurrentMode("REVIEW");
      setHasStarted(false);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = async () => {
    if (!quiz || isResetting) return;

    try {
      setIsResetting(true);
      setError("");

      // Delete existing submission to allow fresh attempt
      await fetch(`/api/classrooms/${classroomId}/quizzes/${quiz.id}/submit`, {
        method: "DELETE",
      });

      // Reset state for new attempt
      setResult(null);
      setCurrentMode("TAKE");
      setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
      const totalSecs = Math.max(1, (quiz.timeLimitMinutes || 15) * 60);
      setSecondsRemaining(totalSecs);
      isAutoSubmitting.current = false;
      setHasStarted(true);

      onSubmitted();
    } catch (err: any) {
      console.error("Error resetting quiz for retake:", err);
      // Fallback: reset locally so student can still retake
      setResult(null);
      setCurrentMode("TAKE");
      setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
      setSecondsRemaining(Math.max(1, (quiz.timeLimitMinutes || 15) * 60));
      isAutoSubmitting.current = false;
      setHasStarted(true);
    } finally {
      setIsResetting(false);
    }
  };

  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, secs);
    const mins = Math.floor(safeSecs / 60);
    const remainder = safeSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;
  const unansweredCount = quiz.questions.length - answeredCount;

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
              {quiz.questions.length} {language === "bn" ? "টি প্রশ্ন" : "Questions"} • {totalPoints}{" "}
              {language === "bn" ? "মোট নম্বর" : "Total Points"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Countdown Badge (if active taking) */}
            {!result && hasStarted && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-mono text-xs sm:text-sm font-bold border transition-colors ${
                  secondsRemaining <= 60
                    ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400 animate-pulse"
                    : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <Clock size={16} />
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            )}

            <button
              type="button"
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
                      {language === "bn" ? "স্বয়ংক্রিয় মূল্যায়ন ফলাফল" : "Auto-Graded Result"}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                      {result.score} / {result.totalPoints || totalPoints}{" "}
                      {language === "bn" ? "নম্বর" : "Points"}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right sm:text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {result.percentage}%
                    </span>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {result.percentage >= 60
                        ? language === "bn"
                          ? "চমৎকার দক্ষতা"
                          : "Proficient Mastery"
                        : language === "bn"
                        ? "আরও অনুশীলনের পরামর্শ"
                        : "Review Recommended"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-emerald-100 dark:border-emerald-900/40 pt-3">
                {language === "bn"
                  ? "নিচে আপনার উত্তরগুলো দেখুন। সঠিক উত্তর ও আপনার নির্বাচিত অপশনগুলো পর্যালোচনার জন্য চিহ্নিত করা হয়েছে।"
                  : "Review your responses below. Correct answers and your selected choices are highlighted for academic study."}
              </p>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-5">
            {quiz.questions.map((q, qIdx) => {
              const rawSelected = result
                ? (result.review?.[qIdx]?.userSelected ?? result.selectedAnswers?.[qIdx] ?? selectedAnswers[qIdx])
                : selectedAnswers[qIdx];
              const userSelected = typeof rawSelected === "number" ? rawSelected : -1;

              const rawCorrect = result?.review?.[qIdx]?.correctOptionIndex ?? q.correctOptionIndex;
              const hasAnswerKey = rawCorrect !== undefined && rawCorrect !== null;
              const correctIdx = hasAnswerKey ? Number(rawCorrect) : -1;
              const isCorrectAnswer = result ? userSelected >= 0 && userSelected === correctIdx : null;

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
                        {q.points} {language === "bn" ? "নম্বর" : q.points === 1 ? "pt" : "pts"}
                      </span>
                      {result &&
                        (isCorrectAnswer ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} />
                            <span>{language === "bn" ? "সঠিক" : "Correct"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <XCircle size={12} />
                            <span>{language === "bn" ? "ভুল" : "Incorrect"}</span>
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userSelected === optIdx;
                      const isThisCorrect = hasAnswerKey && correctIdx === optIdx;

                      let cardStyle =
                        "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800";

                      if (result) {
                        if (isThisCorrect) {
                          cardStyle =
                            "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500";
                        } else if (isSelected && !isThisCorrect) {
                          cardStyle =
                            "border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-semibold ring-1 ring-rose-400";
                        } else {
                          cardStyle =
                            "border-slate-100 dark:border-slate-800 bg-transparent opacity-60";
                        }
                      } else if (isSelected) {
                        cardStyle =
                          "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={!!result}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${cardStyle} ${
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
                            <CheckCircle2
                              size={16}
                              className="text-emerald-600 dark:text-emerald-400 shrink-0"
                            />
                          )}
                          {isSelected && !isThisCorrect && result && (
                            <XCircle size={16} className="text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Box (Revealed only upon quiz submission or in review mode) */}
                  {result && (q.explanation || result.review?.[qIdx]?.explanation) && (
                    <div className="mt-2.5 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in duration-150">
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                        <Lightbulb size={14} className="text-amber-500 shrink-0" />
                        <span>{language === "bn" ? "ব্যাখ্যা (Explanation & Logic):" : "Explanation & Logic:"}</span>
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.explanation || result.review?.[qIdx]?.explanation}
                      </p>
                    </div>
                  )}
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
                {language === "bn" ? (
                  <>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {answeredCount}
                    </strong>{" "}
                    / {quiz.questions.length} প্রশ্নের উত্তর দেওয়া হয়েছে
                  </>
                ) : (
                  <>
                    Answered{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {answeredCount}
                    </strong>{" "}
                    of {quiz.questions.length} questions
                  </>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  {language === "bn" ? "প্রস্থান করুন" : "Save & Exit"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingSubmit(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{language === "bn" ? "মূল্যায়ন হচ্ছে..." : "Grading..."}</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{language === "bn" ? "কুইজ জমা দিন" : "Submit Quiz"}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetakeQuiz}
                disabled={isResetting}
                className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{language === "bn" ? "প্রস্তুত হচ্ছে..." : "Resetting..."}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>{language === "bn" ? "পুনরায় কুইজ দিন" : "Retake Quiz"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {language === "bn" ? "রিভিউ বন্ধ করুন" : "Close Review"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {isConfirmingSubmit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={22} strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {language === "bn" ? "কুইজ জমা নিশ্চিত করুন" : "Confirm Quiz Submission"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === "bn"
                    ? `আপনি ${quiz.questions.length}টির মধ্যে ${answeredCount}টি প্রশ্নের উত্তর দিয়েছেন।`
                    : `You have answered ${answeredCount} of ${quiz.questions.length} questions.`}
                </p>
              </div>
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/60">
                {language === "bn"
                  ? `সতর্কতা: ${unansweredCount}টি প্রশ্নের উত্তর এখনও বাকি আছে। জমা দিলে বাকিগুলোর জন্য শূন্য নম্বর দেওয়া হবে।`
                  : `Notice: You have ${unansweredCount} unanswered questions. Blank answers will be graded as incorrect.`}
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingSubmit(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === "bn" ? "ফিরে যান" : "Continue Quiz"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingSubmit(false);
                  handleSubmitQuiz();
                }}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
              >
                {language === "bn" ? "হ্যাঁ, জমা দিন" : "Yes, Submit Quiz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
