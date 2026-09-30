"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface QuestionItem {
  question: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
}

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  onQuizCreated: () => void;
}

export default function CreateQuizModal({
  isOpen,
  onClose,
  classroomId,
  onQuizCreated,
}: CreateQuizModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);
  const [dueDate, setDueDate] = useState("");

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      points: 1,
    },
  ]);

  // AI Generator states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiGrade, setAiGrade] = useState("Grade 9-10");
  const [aiCount, setAiCount] = useState(5);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, question: val } : q))
    );
  };

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleCorrectOptionChange = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctOptionIndex: optIdx } : q))
    );
  };

  const handlePointsChange = (qIdx: number, points: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, points: Math.max(1, points) } : q))
    );
  };

  const handleGenerateWithAi = async () => {
    if (!aiTopic.trim()) {
      setAiError("Please enter an academic topic.");
      return;
    }

    try {
      setIsGeneratingAi(true);
      setAiError("");

      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          gradeLevel: aiGrade,
          numQuestions: aiCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions with AI.");
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        if (!title.trim()) {
          setTitle(`Quiz: ${aiTopic.trim()}`);
        }
        setQuestions(data.questions);
        setIsAiOpen(false);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate quiz.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} cannot be blank.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Option ${String.fromCharCode(65 + j)} for Question ${i + 1} cannot be blank.`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          timeLimitMinutes: Number(timeLimitMinutes) || 15,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create quiz.");
      }

      onQuizCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error creating quiz.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl my-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <HelpCircle strokeWidth={1.75} size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Create Auto-Graded Quiz
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Craft structured MCQs manually or generate with Gemini AI
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* AI Generator Accordion Card */}
          <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-300 dark:shadow-none">
                  <Sparkles size={16} strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Gemini AI Question Generator
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Autofill 5–10 curriculum-aligned MCQs instantly using Gemini 3.8 Flash
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen(!isAiOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Sparkles size={14} />
                <span>{isAiOpen ? "Hide Generator" : "Generate with Gemini AI"}</span>
              </button>
            </div>

            {isAiOpen && (
              <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Academic Topic / Concept
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Newton's Laws of Motion, Photosynthesis, Organic Chemistry..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      value={aiGrade}
                      onChange={(e) => setAiGrade(e.target.value)}
                      placeholder="e.g. Grade 9-10"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Questions:</span>
                    {[3, 5, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiCount(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          aiCount === num
                            ? "bg-indigo-600 text-white"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAi || !aiTopic.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating questions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Autofill Questions</span>
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                    {aiError}
                  </p>
                )}
              </div>
            )}
          </div>

          <form id="create-quiz-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Quiz Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Photosynthesis Mastery Test"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Instructions / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for students (e.g. select the most accurate option, no negative marking)..."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Time Limit (Minutes)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 1)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Questions Header */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Quiz Questions ({questions.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Total Points: {questions.reduce((sum, q) => sum + (q.points || 1), 0)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-xs font-bold transition-colors"
              >
                <Plus size={14} />
                <span>Add Question</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      Question {qIdx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Pts:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.points}
                          onChange={(e) => handlePointsChange(qIdx, Number(e.target.value) || 1)}
                          className="w-12 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center font-bold text-xs"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIdx, e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Options (Click radio to select the correct answer):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleCorrectOptionChange(qIdx, optIdx)}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                              isCorrect
                                ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIdx}-correct`}
                              checked={isCorrect}
                              onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-mono text-xs font-bold text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                              required
                            />
                            {isCorrect && (
                              <CheckCircle2
                                size={14}
                                className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-quiz-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Publishing Quiz...</span>
              </>
            ) : (
              <>
                <HelpCircle size={14} />
                <span>Publish Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
