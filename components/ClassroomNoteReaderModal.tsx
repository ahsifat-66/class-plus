"use client";

import React, { useState } from "react";
import { X, BookOpen, Calendar, User, ExternalLink, Download, FileText, Edit3, Trash2 } from "lucide-react";

interface ClassroomNoteReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: string;
    title: string;
    subject: string;
    content?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    driveUrl?: string | null;
    createdAt: string | Date;
    user?: {
      id: string;
      name: string;
      email: string;
      avatar?: string | null;
      role?: string;
    } | null;
  } | null;
  currentUserId?: string;
  isTeacher?: boolean;
  onEdit?: (note: any) => void;
  onDelete?: (note: any) => void;
}

export default function ClassroomNoteReaderModal({
  isOpen,
  onClose,
  note,
  currentUserId,
  isTeacher,
  onEdit,
  onDelete,
}: ClassroomNoteReaderModalProps) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  if (!isOpen || !note) return null;

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

  const isAuthor = currentUserId && note.user?.id === currentUserId;
  const canDelete = isAuthor || isTeacher;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {note.subject}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(note.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {note.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Contributor Profile Banner */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
              {note.user?.name ? note.user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {note.user?.name || "Classroom Member"}
                </span>
                {note.user?.role === "TEACHER" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                    Instructor
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{note.user?.email || ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthor && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(note);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Edit</span>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(note);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {note.content ? (
            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              {note.content}
            </div>
          ) : (
            <p className="text-xs italic text-slate-400">No text notes included for this entry.</p>
          )}

          {/* Links & Attachments */}
          <div className="space-y-2 pt-2">
            {note.driveUrl && (
              <a
                href={note.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-900/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Open Resource in Google Drive
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 truncate max-w-sm">
                      {note.driveUrl}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0" strokeWidth={1.75} />
              </a>
            )}

            {note.fileUrl && (
              <a
                href={note.fileUrl}
                download={note.fileName || "attachment"}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {note.fileName || "Attached Document"}
                    </p>
                    <p className="text-[11px] text-slate-400">Click to download attachment</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 ml-3">
                  <Download className="h-4 w-4" strokeWidth={1.75} />
                  <span>Download</span>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
