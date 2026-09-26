"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Award,
  CheckCircle,
  Clock,
  Check,
  MessageSquare,
  ExternalLink,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Copy,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { parseSubmissionContent, SubmissionData } from "@/lib/submission-utils";

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
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState<string>("");
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      if (deltaY > 75) {
        onClose();
      }
      setTouchStartY(null);
    }
  };

  // Initialize selected submission when assignment changes or modal opens
  useEffect(() => {
    if (isOpen && assignment?.submissions && assignment.submissions.length > 0) {
      const firstSub = assignment.submissions[0];
      setSelectedSubmissionId(firstSub.id);
      setGradeInput(firstSub.grade !== null ? firstSub.grade.toString() : "");
      setFeedbackInput(firstSub.feedback || "");
    } else {
      setSelectedSubmissionId(null);
      setGradeInput("");
      setFeedbackInput("");
    }
    setSuccessMsg("");
    setErrorMsg("");
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const submissions = assignment.submissions || [];
  const selectedIndex = submissions.findIndex((s) => s.id === selectedSubmissionId);
  const selectedSubmission = selectedIndex >= 0 ? submissions[selectedIndex] : submissions[0] || null;

  const gradedCount = submissions.filter((s) => s.grade !== null).length;

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setSelectedSubmissionId(sub.id);
    setGradeInput(sub.grade !== null ? sub.grade.toString() : "");
    setFeedbackInput(sub.feedback || "");
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleQuickScore = (percentage: number) => {
    const points = Math.round((assignment.maxPoints * percentage) / 100);
    setGradeInput(points.toString());
  };

  const handleQuickFeedback = (snippet: string) => {
    if (!feedbackInput) {
      setFeedbackInput(snippet);
    } else {
      setFeedbackInput((prev) => `${prev.trim()} ${snippet}`);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSaveGrade = async (e?: React.FormEvent, andNext = false) => {
    if (e) e.preventDefault();
    if (!selectedSubmission) return;

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const parsedGrade = gradeInput.trim() !== "" ? parseInt(gradeInput, 10) : null;
      if (parsedGrade !== null && (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > assignment.maxPoints)) {
        setErrorMsg(`Points must be a valid number between 0 and ${assignment.maxPoints}.`);
        setIsSaving(false);
        return;
      }

      const res = await fetch(`/api/submissions/${selectedSubmission.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: parsedGrade,
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

      if (andNext && selectedIndex >= 0 && selectedIndex < submissions.length - 1) {
        const nextSub = submissions[selectedIndex + 1];
        handleSelectSubmission(nextSub);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  const parsedContent: SubmissionData = selectedSubmission
    ? parseSubmissionContent(selectedSubmission.content)
    : { text: "" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Grade Submissions
              </span>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-xs font-semibold">
                Max {assignment.maxPoints} pts
              </span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-xs font-semibold">
                {gradedCount} / {submissions.length} Graded
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {assignment.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Mobile Horizontal Student Selector (< md) */}
        {submissions.length > 0 && (
          <div className="md:hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-2 overflow-x-auto shrink-0 flex items-center gap-2 scrollbar-none">
            {submissions.map((sub, idx) => {
              const isSelected = selectedSubmission?.id === sub.id;
              const isGraded = sub.grade !== null;

              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 min-h-[40px] active:scale-95 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="truncate max-w-[100px]">{sub.student.name}</span>
                  {isGraded ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {sub.grade}p
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Layout: Desktop Left Sidebar + Right Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Student List Sidebar (hidden on mobile, visible md:block) */}
          <div className="hidden md:flex flex-col w-72 border-r border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950 shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Students ({submissions.length})</span>
              <span>{Math.round((gradedCount / (submissions.length || 1)) * 100)}% done</span>
            </div>

            {submissions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No submissions turned in yet.
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {submissions.map((sub) => {
                  const isSelected = selectedSubmission?.id === sub.id;
                  const isGraded = sub.grade !== null;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubmission(sub)}
                      className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={sub.student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.student.name)}`}
                          alt={sub.student.name}
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-white/30 shrink-0"
                        />
                        <div className="truncate min-w-0">
                          <div className="text-xs font-semibold truncate leading-tight">
                            {sub.student.name}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"
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
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {sub.grade}p
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Selected Submission & Grading Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {selectedSubmission ? (
              <div className="space-y-6">
                {/* Student Info Bar & Navigation Header */}
                {/* Student Info Bar & Navigation Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        selectedSubmission.student.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSubmission.student.name)}`
                      }
                      alt={selectedSubmission.student.name}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          {selectedSubmission.student.name}
                        </h4>
                        {selectedSubmission.grade !== null && (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5">
                            {selectedSubmission.grade} / {assignment.maxPoints} pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedSubmission.student.email} • Submitted {formatDate(selectedSubmission.submittedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Previous / Next Student Navigator */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      disabled={selectedIndex <= 0}
                      onClick={() => handleSelectSubmission(submissions[selectedIndex - 1])}
                      className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Previous submission"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 min-h-[44px] flex items-center">
                      {selectedIndex + 1} / {submissions.length}
                    </span>
                    <button
                      type="button"
                      disabled={selectedIndex >= submissions.length - 1}
                      onClick={() => handleSelectSubmission(submissions[selectedIndex + 1])}
                      className="min-h-[44px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Next submission"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                {/* Student Deliverables: Drive Link, File Attachment, and Written Solution */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Student Deliverables
                  </span>

                  {/* 1. Google Drive / Cloud Share Link Card */}
                  {parsedContent.driveUrl && (
                    <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/40 dark:to-blue-950/30 p-4 shadow-sm hover:border-indigo-400 transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5z" fill="#0066DA" />
                              <path d="M16.29 3.5H7.71l6.55 11.5h8.59L16.29 3.5z" fill="#00AC47" />
                              <path d="M14.26 15L7.71 3.5 1.15 15h13.11z" fill="#00832D" opacity="0.1" />
                              <path d="M22.85 15l-3.43 6H4.58l3.43-6h14.84z" fill="#EA4335" />
                              <path d="M16.29 3.5l6.56 11.5-3.43 6-6.56-11.5 3.43-6z" fill="#FFBA00" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full inline-block mb-0.5">
                              Google Drive Project File
                            </span>
                            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-md">
                              {parsedContent.driveUrl}
                            </div>
                          </div>
                        </div>

                        <a
                          href={parsedContent.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all shrink-0 min-h-[44px]"
                        >
                          <span>Open in Google Drive</span>
                          <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 2. Direct File Attachment Preview (JPEG, PNG, PDF, docs) */}
                  {parsedContent.fileUrl && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {parsedContent.fileName || "Attached Deliverable"}
                            </div>
                            {parsedContent.fileSize && (
                              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                {parsedContent.fileSize}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={parsedContent.fileUrl}
                            download={parsedContent.fileName || "submission-attachment"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm min-h-[44px]"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>

                      {/* Image Viewer Thumbnail */}
                      {(parsedContent.fileType?.startsWith("image/") ||
                        parsedContent.fileUrl.startsWith("data:image/")) && (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/30 max-h-72 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={parsedContent.fileUrl}
                            alt={parsedContent.fileName || "Submitted Attachment"}
                            className="max-h-72 w-auto object-contain cursor-pointer transition-transform group-hover:scale-[1.01]"
                            onClick={() => setZoomedImage(parsedContent.fileUrl || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedImage(parsedContent.fileUrl || null)}
                            className="absolute bottom-2 right-2 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white p-2.5 backdrop-blur-sm transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
                            title="Zoom Image"
                          >
                            <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Written Solution / Code Textarea */}
                  {parsedContent.text ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          Written Response / Query Solution
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCopyText(parsedContent.text || "")}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-1"
                        >
                          {copiedText ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                              <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="rounded-2xl bg-slate-900 p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-64 border border-slate-800">
                        {parsedContent.text}
                      </pre>
                    </div>
                  ) : !parsedContent.driveUrl && !parsedContent.fileUrl ? (
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-xs text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800">
                      Student submitted without text or attachment.
                    </div>
                  ) : null}
                </div>

                {/* Grading & Feedback Form */}
                <form onSubmit={(e) => handleSaveGrade(e, false)} className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Award Points (Max {assignment.maxPoints})
                      </label>
                      {gradeInput !== "" && !isNaN(Number(gradeInput)) && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round((Number(gradeInput) / assignment.maxPoints) * 100)}% score
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative w-36 sm:w-44">
                        <input
                          type="number"
                          min={0}
                          max={assignment.maxPoints}
                          value={gradeInput}
                          onChange={(e) => setGradeInput(e.target.value)}
                          placeholder={`0 - ${assignment.maxPoints}`}
                          className="w-full text-base sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 font-bold text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                          required
                        />
                        <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                          / {assignment.maxPoints}
                        </span>
                      </div>

                      {/* Quick Score Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[100, 90, 80, 75].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleQuickScore(pct)}
                            className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors min-h-[44px]"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Instructor Feedback
                      </label>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">Student will see this</span>
                    </div>

                    {/* Quick feedback snippet chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pb-1">
                      <button
                        type="button"
                        onClick={() => handleQuickFeedback("Great work! Thorough and accurate solution.")}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors min-h-[36px]"
                      >
                        + Great work!
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFeedback("Good effort! Consider checking query indexing and edge cases.")}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors min-h-[36px]"
                      >
                        + Check optimization
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFeedback("Well documented and clearly explained.")}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors min-h-[36px]"
                      >
                        + Well documented
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="e.g. Excellent solution! Clear query logic and good performance considerations..."
                      className="w-full text-base sm:text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed min-h-[80px]"
                    />
                  </div>

                  {successMsg && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2 flex-wrap">
                    {selectedIndex < submissions.length - 1 && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveGrade(undefined, true)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 min-h-[44px]"
                      >
                        Save & Next Student
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      <Award className="h-4 w-4" strokeWidth={1.75} />
                      <span>{isSaving ? "Saving Grade..." : "Save Grade & Feedback"}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a student submission to review and grade.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full Image Zoom */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomedImage}
              alt="Zoomed Attachment"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white text-slate-900 p-2 shadow-lg hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
