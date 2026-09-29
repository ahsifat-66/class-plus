"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Plus,
  ExternalLink,
  FileText,
  Calendar,
  MoreVertical,
  Edit3,
  Trash2,
  Users,
  Tag,
  Paperclip,
} from "lucide-react";
import CreateClassroomNoteModal from "./CreateClassroomNoteModal";
import ClassroomNoteReaderModal from "./ClassroomNoteReaderModal";
import EditClassroomNoteModal from "./EditClassroomNoteModal";
import DeleteNoteConfirmModal from "./DeleteNoteConfirmModal";

export interface NoteItem {
  id: string;
  classroomId: string;
  userId: string;
  title: string;
  subject: string;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  driveUrl?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role?: string;
  } | null;
}

interface ClassroomNoteBoxProps {
  classroomId: string;
  notes: NoteItem[];
  currentUserId?: string;
  isTeacher?: boolean;
  onRefreshNotes: () => void;
}

export default function ClassroomNoteBox({
  classroomId,
  notes = [],
  currentUserId,
  isTeacher = false,
  onRefreshNotes,
}: ClassroomNoteBoxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [readingNote, setReadingNote] = useState<NoteItem | null>(null);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deletingNote, setDeletingNote] = useState<NoteItem | null>(null);
  const [menuOpenNoteId, setMenuOpenNoteId] = useState<string | null>(null);

  // Dynamic Subjects & Counts
  const { subjects, subjectCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      const s = note.subject.trim();
      counts[s] = (counts[s] || 0) + 1;
    });
    return {
      subjects: Object.keys(counts).sort(),
      subjectCounts: counts,
    };
  }, [notes]);

  // Unique Contributors
  const contributors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; avatar?: string | null; count: number }>();
    notes.forEach((note) => {
      if (note.user) {
        const existing = map.get(note.user.id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(note.user.id, {
            id: note.user.id,
            name: note.user.name,
            email: note.user.email,
            avatar: note.user.avatar,
            count: 1,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSubject =
        selectedSubject === "ALL" ||
        note.subject.toLowerCase() === selectedSubject.toLowerCase();

      if (!matchesSubject) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = note.title.toLowerCase().includes(q);
      const matchSubject = note.subject.toLowerCase().includes(q);
      const matchContent = note.content ? note.content.toLowerCase().includes(q) : false;
      const matchAuthor = note.user?.name ? note.user.name.toLowerCase().includes(q) : false;

      return matchTitle || matchSubject || matchContent || matchAuthor;
    });
  }, [notes, selectedSubject, searchQuery]);

  return (
    <div className="space-y-6">
      {/* NoteBox Header Banner */}
      <div className="rounded-3xl border border-teal-200/70 dark:border-teal-900/50 bg-gradient-to-br from-teal-50/50 via-white to-teal-50/30 dark:from-teal-950/20 dark:via-slate-900 dark:to-teal-950/10 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 shrink-0">
              <BookOpen className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Classroom NoteBox
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Collaborative academic repository for study guides, lecture summaries, problem sheets, and external reference drives.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95 shrink-0 min-h-[44px]"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span>Share Note</span>
          </button>
        </div>

        {/* Contributors Shortlist */}
        {contributors.length > 0 && (
          <div className="mt-5 pt-4 border-t border-teal-100 dark:border-teal-900/40 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Contributors:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {contributors.map((contrib) => (
                <div
                  key={contrib.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs shadow-2xs"
                >
                  <div className="h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px] font-bold">
                    {contrib.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{contrib.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold border border-teal-200 dark:border-teal-800">
                    {contrib.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, subject, content, or author..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[44px]"
            />
          </div>
        </div>

        {/* Dynamic Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedSubject("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedSubject === "ALL"
                ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Subjects ({notes.length})
          </button>
          {subjects.map((subj) => {
            const count = subjectCounts[subj] || 0;
            const isSelected = selectedSubject.toLowerCase() === subj.toLowerCase();
            return (
              <button
                type="button"
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {subj} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mb-3">
            <BookOpen className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {searchQuery || selectedSubject !== "ALL" ? "No matching notes found" : "No notes published yet"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || selectedSubject !== "ALL"
              ? "Try adjusting your search keywords or resetting the subject filter."
              : "Be the first to share a lecture summary, formula cheat sheet, or Drive folder with your class."}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-all"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            <span>Share Note Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isAuthor = currentUserId && note.user?.id === currentUserId;
            const canManage = isAuthor || isTeacher;

            return (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer"
                onClick={() => setReadingNote(note)}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {note.subject}
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">
                        {new Date(note.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {canManage && (
                        <div
                          className="relative"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenNoteId(menuOpenNoteId === note.id ? null : note.id)
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                          </button>

                          {menuOpenNoteId === note.id && (
                            <div className="absolute right-0 top-7 z-20 w-36 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                              {isAuthor && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenNoteId(null);
                                    setEditingNote(note);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  <span>Edit Note</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenNoteId(null);
                                  setDeletingNote(note);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span>Delete Note</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug">
                    {note.title}
                  </h3>

                  {/* Content snippet */}
                  {note.content && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                  )}

                  {/* Attachment indicators */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {note.driveUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[10px] font-semibold text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                        <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                        <span>Drive Resource</span>
                      </span>
                    )}
                    {note.fileUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 max-w-[160px] truncate">
                        <FileText className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{note.fileName || "Attachment"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer / Author info */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {note.user?.name ? note.user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {note.user?.name || "Classroom Member"}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 group-hover:underline shrink-0">
                    Read Note &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateClassroomNoteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        classroomId={classroomId}
        onNoteCreated={() => {
          onRefreshNotes();
        }}
        suggestedSubjects={subjects}
      />

      <ClassroomNoteReaderModal
        isOpen={!!readingNote}
        onClose={() => setReadingNote(null)}
        note={readingNote}
        currentUserId={currentUserId}
        isTeacher={isTeacher}
        onEdit={(n) => setEditingNote(n)}
        onDelete={(n) => setDeletingNote(n)}
      />

      <EditClassroomNoteModal
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        classroomId={classroomId}
        note={editingNote}
        onNoteUpdated={() => {
          onRefreshNotes();
        }}
        suggestedSubjects={subjects}
      />

      <DeleteNoteConfirmModal
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        classroomId={classroomId}
        note={deletingNote}
        onNoteDeleted={() => {
          onRefreshNotes();
        }}
      />
    </div>
  );
}
