"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  BookMarked,
  CheckSquare,
  Square,
  Loader2,
  Search,
  Check,
  BookOpen,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { classBooksData, Book } from "@/data/booksData";

interface AssignBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  currentBookIds?: string[];
  onSuccess: (updatedBookIds: string[]) => void;
}

export default function AssignBooksModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  currentBookIds = [],
  onSuccess,
}: AssignBooksModalProps) {
  const { language } = useLanguage();
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [activeVersion, setActiveVersion] = useState<"bangla" | "english">("bangla");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state whenever modal opens or currentBookIds change
  useEffect(() => {
    if (isOpen) {
      setSelectedBookIds(currentBookIds);
      setSearchQuery("");
      setError("");

      // If classroom already has mostly English books, default to english tab, otherwise bangla
      const hasEnglish = currentBookIds.some((id) => id.includes("-en-"));
      const hasBangla = currentBookIds.some((id) => id.includes("-bn-"));
      if (hasEnglish && !hasBangla) {
        setActiveVersion("english");
      } else {
        setActiveVersion("bangla");
      }
    }
  }, [isOpen, currentBookIds]);

  const banglaBooks: Book[] = useMemo(
    () => classBooksData[0]?.versions.banglaVersion || [],
    []
  );
  const englishBooks: Book[] = useMemo(
    () => classBooksData[0]?.versions.englishVersion || [],
    []
  );

  // Books for active version tab
  const currentVersionBooks = activeVersion === "bangla" ? banglaBooks : englishBooks;

  // Filter within active version by search query
  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentVersionBooks;
    return currentVersionBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
    );
  }, [currentVersionBooks, searchQuery]);

  // Selected counts per version
  const selectedBanglaCount = useMemo(() => {
    return banglaBooks.filter((b) => selectedBookIds.includes(b.id)).length;
  }, [banglaBooks, selectedBookIds]);

  const selectedEnglishCount = useMemo(() => {
    return englishBooks.filter((b) => selectedBookIds.includes(b.id)).length;
  }, [englishBooks, selectedBookIds]);

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const allActiveSelected =
    currentVersionBooks.length > 0 &&
    currentVersionBooks.every((b) => selectedBookIds.includes(b.id));

  const handleSelectAllActive = () => {
    const activeIds = currentVersionBooks.map((b) => b.id);
    setSelectedBookIds((prev) => Array.from(new Set([...prev, ...activeIds])));
  };

  const handleDeselectAllActive = () => {
    const activeIds = new Set(currentVersionBooks.map((b) => b.id));
    setSelectedBookIds((prev) => prev.filter((id) => !activeIds.has(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId) return;

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookIds: selectedBookIds,
          textbookIds: selectedBookIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update textbooks");
      }

      onSuccess(selectedBookIds);
      onClose();
    } catch (err: any) {
      console.error("Error updating textbooks:", err);
      setError(err.message || "Failed to update textbooks.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BookMarked strokeWidth={1.75} size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {language === "bn"
                  ? "বুকশেলফে পাঠ্যবই যোগ বা পরিবর্তন করুন"
                  : "Manage Classroom Textbooks"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {classroomName} • {language === "bn" ? "৬ষ্ঠ শ্রেণি (বাংলা ও ইংলিশ ভার্সন)" : "Class 6 (Bangla & English Versions)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            {error}
          </div>
        )}

        {/* 2-Way Version Selector Tabs */}
        <div className="mt-4 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-2 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveVersion("bangla")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeVersion === "bangla"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>বাংলা ভার্সন</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all ${
                selectedBanglaCount > 0
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}
            >
              {selectedBanglaCount} / {banglaBooks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveVersion("english")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeVersion === "english"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>English Version</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-all ${
                selectedEnglishCount > 0
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              }`}
            >
              {selectedEnglishCount} / {englishBooks.length}
            </span>
          </button>
        </div>

        {/* Search & Bulk selection toolbar */}
        <div className="mt-3 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeVersion === "bangla"
                    ? "বাংলা ভার্সনের বই খুঁজুন (শিরোনাম বা বিষয়)..."
                    : "Search English version textbooks by title or subject..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={allActiveSelected ? handleDeselectAllActive : handleSelectAllActive}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {allActiveSelected ? (
                  <>
                    <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>{language === "bn" ? "সবগুলো বাদ দিন" : "Deselect All"}</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>{language === "bn" ? "সবগুলো নির্বাচন করুন" : "Select All"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
            <span>
              {activeVersion === "bangla"
                ? "বাংলা ভার্সনের ১৫টি এনসিটিবি অনুমোদিত পাঠ্যবই"
                : "15 official NCTB English version textbooks"}
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
              {activeVersion === "bangla" ? selectedBanglaCount : selectedEnglishCount} /{" "}
              {currentVersionBooks.length} {language === "bn" ? "নির্বাচিত" : "selected"}
            </span>
          </div>
        </div>

        {/* Books selection list */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {filteredBooks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {language === "bn" ? "কোনো বই পাওয়া যায়নি।" : "No textbooks match your search."}
            </div>
          ) : (
            filteredBooks.map((book) => {
              const isChecked = selectedBookIds.includes(book.id);
              return (
                <div
                  key={book.id}
                  onClick={() => handleToggleBook(book.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40"
                      : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div onClick
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {book.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                          {book.subject}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            book.version === "english"
                              ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {book.version === "english" ? "English" : "বাংলা"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isChecked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950 px-2.5 py-1 rounded-xl">
                        <Check size={12} strokeWidth={2.5} />
                        {language === "bn" ? "যুক্ত আছে" : "Added"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-2 py-0.5">
                        {language === "bn" ? "বাদ আছে" : "Excluded"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{language === "bn" ? "মোট নির্বাচিত:" : "Total Selected:"} </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedBookIds.length}{" "}
              {language === "bn"
                ? `টি বই (বাংলা: ${selectedBanglaCount}, ইংলিশ: ${selectedEnglishCount})`
                : `books (Bangla: ${selectedBanglaCount}, English: ${selectedEnglishCount})`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{language === "bn" ? "সংরক্ষণ করা হচ্ছে..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  <span>
                    {language === "bn"
                      ? `বুকশেলফে সংরক্ষণ করুন (${selectedBookIds.length})`
                      : `Save to BookShelf (${selectedBookIds.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
