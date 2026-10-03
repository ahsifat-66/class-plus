"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface QuestionExplanationCardProps {
  questionId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex?: number;
  correctAnswer?: number | string;
  explanation?: string | null;
  pageReference?: string | null;
}

function isValidExplanation(exp?: string | null): boolean {
  if (!exp || !exp.trim()) return false;
  const str = exp.trim();
  if (
    str.includes("একাডেমিক যুক্তির ভিত্তিতে") ||
    str.includes("নির্বাচনটি প্রাসঙ্গিক এবং সঠিক") ||
    str.includes("পাঠ্যবই অনুযায়ী সঠিক উত্তর হলো অপশন")
  ) {
    return false;
  }
  return true;
}

export default function QuestionExplanationCard({
  questionId,
  questionText,
  options,
  correctOptionIndex,
  correctAnswer,
  explanation: initialExplanation,
  pageReference: initialPageReference,
}: QuestionExplanationCardProps) {
  const { language } = useLanguage();
  const hasValidInitial = isValidExplanation(initialExplanation);

  const [explanation, setExplanation] = useState<string>(
    hasValidInitial ? (initialExplanation || "").trim() : ""
  );
  const [pageReference, setPageReference] = useState<string>(
    initialPageReference ? initialPageReference.trim() : ""
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasValidInitial);
  const attemptedRef = useRef<boolean>(hasValidInitial);

  useEffect(() => {
    // If we already have a valid explanation, keep it
    if (isValidExplanation(initialExplanation)) {
      setExplanation((initialExplanation || "").trim());
      if (initialPageReference) {
        setPageReference(initialPageReference.trim());
      }
      setIsLoading(false);
      attemptedRef.current = true;
      return;
    }

    // Only fetch on-the-fly once
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    setIsLoading(true);

    let isMounted = true;
    const controller = new AbortController();

    async function fetchExplanation() {
      try {
        const res = await fetch("/api/quiz/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            questionId,
            prompt: questionText,
            options,
            correctOptionIndex,
            correctAnswer,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch explanation");
        }

        const data = await res.json();
        if (isMounted) {
          if (data?.explanation && isValidExplanation(data.explanation)) {
            setExplanation(data.explanation.trim());
          }
          if (data?.pageReference) {
            setPageReference(data.pageReference.trim());
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[QuestionExplanationCard] On-the-fly fetch failed:", err?.message || err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchExplanation();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    questionId,
    questionText,
    options,
    correctOptionIndex,
    correctAnswer,
    initialExplanation,
    initialPageReference,
  ]);

  if (isLoading) {
    return (
      <div className="mt-3 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-900/80 dark:text-indigo-300 flex items-center gap-2 animate-pulse">
        <Loader2 size={14} className="animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-semibold">
          {language === "bn" ? "💡 ব্যাখ্যা তৈরি হচ্ছে..." : "💡 Generating explanation..."}
        </span>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="mt-3 p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 animate-in fade-in duration-150">
      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 mb-1">
        <span>💡</span>
        <span>{language === "bn" ? "ব্যাখ্যা ও বিশ্লেষণ:" : "Explanation & Analysis:"}</span>
      </div>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-2 whitespace-pre-wrap">
        {explanation}
      </p>
      {pageReference && (
        <div className="pt-2 mt-2 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-medium">
          <span>📖 {language === "bn" ? "পাঠ্যবই রেফারেন্স:" : "NCTB Reference:"}</span>
          <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold text-[11px]">
            {pageReference}
          </span>
        </div>
      )}
    </div>
  );
}
