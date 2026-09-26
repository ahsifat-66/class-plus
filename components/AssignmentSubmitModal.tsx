"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  CheckCircle2,
  FileText,
  UploadCloud,
  Trash2,
  ExternalLink,
  AlertCircle,
  Check,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import {
  parseSubmissionContent,
  formatSubmissionContent,
  SubmissionData,
} from "@/lib/submission-utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingSubmission = assignment?.submissions?.find(
    (s) => s.studentId === currentUser?.id
  );

  const [text, setText] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    name: string;
    size: string;
    type: string;
  } | null>(null);

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
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

  // Sync state whenever modal opens or existingSubmission changes
  useEffect(() => {
    if (isOpen && existingSubmission) {
      const parsed: SubmissionData = parseSubmissionContent(existingSubmission.content);
      setText(parsed.text || "");
      setDriveUrl(parsed.driveUrl || "");
      if (parsed.fileUrl && parsed.fileName) {
        setAttachedFile({
          url: parsed.fileUrl,
          name: parsed.fileName,
          size: parsed.fileSize || "",
          type: parsed.fileType || "",
        });
      } else {
        setAttachedFile(null);
      }
    } else if (isOpen) {
      setText("");
      setDriveUrl("");
      setAttachedFile(null);
    }
    setError("");
  }, [isOpen, existingSubmission]);

  if (!isOpen || !assignment) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    // Check 10MB absolute maximum
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit. For larger files, please share via Google Drive link.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsProcessingFile(true);

      if (file.type.startsWith("image/")) {
        // High-definition Canvas downscale for images to fit within network payload limits
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
              const MAX_DIM = 1920;
              let width = img.width;
              let height = img.height;

              if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                  height = Math.round((height * MAX_DIM) / width);
                  width = MAX_DIM;
                } else {
                  width = Math.round((width * MAX_DIM) / height);
                  height = MAX_DIM;
                }
              }

              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve(readerEvent.target?.result as string);
                return;
              }

              ctx.drawImage(img, 0, 0, width, height);
              // Compress to 85% JPEG
              const compressed = canvas.toDataURL("image/jpeg", 0.85);
              resolve(compressed);
            };
            img.onerror = () => reject(new Error("Unable to parse image."));
            img.src = readerEvent.target?.result as string;
          };
          reader.onerror = () => reject(new Error("Unable to read image file."));
          reader.readAsDataURL(file);
        });

        const approxBytes = Math.round((dataUrl.length * 3) / 4);
        setAttachedFile({
          url: dataUrl,
          name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
          size: formatFileSize(approxBytes),
          type: "image/jpeg",
        });
      } else {
        // Documents / PDFs: max 3.5MB direct payload (or recommend Google Drive for larger)
        if (file.size > 3.5 * 1024 * 1024) {
          setError(
            "PDFs and docs larger than 3.5MB are recommended to be shared via Google Drive link for instant delivery."
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Unable to read document."));
          reader.readAsDataURL(file);
        });

        setAttachedFile({
          url: dataUrl,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || "application/octet-stream",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to process attached file.");
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasText = text.trim().length > 0;
    const hasDriveUrl = driveUrl.trim().length > 0;
    const hasFile = attachedFile !== null;

    if (!hasText && !hasDriveUrl && !hasFile) {
      setError("Please provide a written solution, a Google Drive link, or attach a file.");
      return;
    }

    if (hasDriveUrl) {
      const trimmedDrive = driveUrl.trim();
      if (!trimmedDrive.startsWith("http://") && !trimmedDrive.startsWith("https://")) {
        setError("Please enter a valid Google Drive or cloud URL starting with https://");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");

      const serializedContent = formatSubmissionContent({
        text: text.trim(),
        driveUrl: driveUrl.trim(),
        fileUrl: attachedFile?.url,
        fileName: attachedFile?.name,
        fileSize: attachedFile?.size,
        fileType: attachedFile?.type,
      });

      const res = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser?.id,
          content: serializedContent,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Assignment Submission
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {assignment.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Existing Grade / Feedback Banner if Graded */}
          {existingSubmission && existingSubmission.grade !== null && (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
                  <span>Graded by Instructor</span>
                </div>
                <span className="rounded-xl bg-emerald-600 text-white font-bold px-3 py-1 text-sm shadow-sm">
                  {existingSubmission.grade} / {assignment.maxPoints} pts
                </span>
              </div>
              {existingSubmission.feedback && (
                <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="font-semibold">Teacher's Feedback: </span>
                  {existingSubmission.feedback}
                </div>
              )}
            </div>
          )}

          {/* Assignment Description Prompt */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Instructions
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <form id="submission-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Google Drive Link Section */}
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5z"
                      fill="#0066DA"
                    />
                    <path
                      d="M16.29 3.5H7.71l6.55 11.5h8.59L16.29 3.5z"
                      fill="#00AC47"
                    />
                    <path
                      d="M14.26 15L7.71 3.5 1.15 15h13.11z"
                      fill="#00832D"
                      opacity="0.1"
                    />
                    <path
                      d="M22.85 15l-3.43 6H4.58l3.43-6h14.84z"
                      fill="#EA4335"
                    />
                    <path
                      d="M16.29 3.5l6.56 11.5-3.43 6-6.56-11.5 3.43-6z"
                      fill="#FFBA00"
                    />
                  </svg>
                  Google Drive / Cloud Share Link
                </label>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  Recommended for large files
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... or any shareable link"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="flex-1 text-base sm:text-sm rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
                />
                {driveUrl.trim() && (
                  <a
                    href={driveUrl.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm min-h-[44px]"
                    title="Test your link in a new tab"
                  >
                    <span>Test</span>
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Please make sure the link access is set to <strong className="text-slate-700 dark:text-slate-300 font-semibold">"Anyone with the link can view"</strong> so your instructor can review it.
              </p>
            </div>

            {/* Direct File Attachment Section (JPEG, PNG, PDF up to 10MB) */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <UploadCloud className="h-4 w-4 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
                Direct File Attachment (JPEG, PNG, PDF up to 10MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="assignment-file-input"
              />

              {!attachedFile ? (
                <label
                  htmlFor="assignment-file-input"
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all cursor-pointer text-center group"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {isProcessingFile ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    ) : (
                      <UploadCloud className="h-5 w-5" strokeWidth={1.75} />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {isProcessingFile ? "Optimizing file..." : "Click to select or drop your file here"}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Images automatically optimized • Max 10MB
                  </span>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachedFile.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachedFile.url}
                        alt="Preview"
                        className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {attachedFile.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check className="h-3 w-3" strokeWidth={2} /> Ready
                        </span>
                        {attachedFile.size && <span>• {attachedFile.size}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeAttachedFile}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Remove attached file"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>

            {/* Written Answer / Solution Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Written Solution / Notes (Optional or Required)
                </label>
                <span className="text-[11px] text-slate-400">
                  Markdown & Code blocks supported
                </span>
              </div>
              <textarea
                rows={5}
                placeholder="Type your SQL query, algorithm solution, or problem explanation here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full font-mono text-base sm:text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="submission-form"
            disabled={isSubmitting || isProcessingFile}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 min-h-[44px]"
          >
            <Send className="h-4 w-4" strokeWidth={1.75} />
            <span>
              {isSubmitting
                ? "Submitting..."
                : existingSubmission
                ? "Update Submission"
                : "Turn In Assignment"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
