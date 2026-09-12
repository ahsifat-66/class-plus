"use client";

import React, { useState } from "react";
import { X, Award, CheckCircle, Clock, Check, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SubmissionItem {
  id: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface TeacherGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    maxPoints: number;
    submissions: SubmissionItem[];
  } | null;
  onGraded: () => void;
}

export default function TeacherGradingModal({
  isOpen,
  onClose,
  assignment,
  onGraded,
}: TeacherGradingModalProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(
    assignment?.submissions?.[0] || null
  );
  const [gradeInput, setGradeInput] = useState<string>(
    assignment?.submissions?.[0]?.grade?.toString() || ""
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(
    assignment?.submissions?.[0]?.feedback || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !assignment) return null;

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade !== null ? sub.grade.toString() : "");
    setFeedbackInput(sub.feedback || "");
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/submissions/${selectedSubmission.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeInput !== "" ? parseInt(gradeInput, 10) : null,
          feedback: feedbackInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save grade");
      }

      const updated = await res.json();
      selectedSubmission.grade = updated.submission.grade;
      selectedSubmission.feedback = updated.submission.feedback;

      setSuccessMsg("Grade and feedback saved successfully!");
      onGraded();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Grade Submissions: {assignment.title}
              </h3>
              <span className="rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                Max {assignment.maxPoints} pts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review student SQL solutions, assign points, and provide constructive feedback.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Left sidebar (student list) + Right view (submission & grading) */}
        <div className="flex-1 flex overflow-hidden min-h-[450px]">
          {/* Student Submissions List */}
          <div className="w-64 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto space-y-1.5 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
              Submissions ({assignment.submissions.length})
            </span>

            {assignment.submissions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No submissions turned in yet.
              </div>
            ) : (
              assignment.submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                const isGraded = sub.grade !== null;

                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sub.student.avatar || ""}
                        alt={sub.student.name}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-white/30 shrink-0"
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {sub.student.name}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-indigo-100" : "text-slate-400"
                          }`}
                        >
                          {formatDate(sub.submittedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isGraded ? (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {sub.grade}p
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          Pending
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Panel: Selected Submission & Grading Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedSubmission ? (
              <div className="space-y-5">
                {/* Student Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedSubmission.student.avatar || ""}
                      alt={selectedSubmission.student.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {selectedSubmission.student.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedSubmission.student.email} • Submitted{" "}
                        {formatDate(selectedSubmission.submittedAt)}
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.grade !== null && (
                    <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-4 w-4" />
                      Current Grade: {selectedSubmission.grade} / {assignment.maxPoints}
                    </span>
                  )}
                </div>

                {/* Submitted Content Code Block */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Student Submission
                  </label>
                  <pre className="rounded-2xl bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedSubmission.content}
                  </pre>
                </div>

                {/* Grading Form */}
                <form onSubmit={handleSaveGrade} className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Award Points (Max {assignment.maxPoints})
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={assignment.maxPoints}
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder={`0 - ${assignment.maxPoints}`}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Constructive Instructor Feedback
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="e.g. Excellent query formulation! Consider adding an index on order_date for faster range scans..."
                      className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {successMsg && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      <Award className="h-4 w-4" />
                      <span>{isSaving ? "Saving Grade..." : "Save Grade & Feedback"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a student submission from the left panel to review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
