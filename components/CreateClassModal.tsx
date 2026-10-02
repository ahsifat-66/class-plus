"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, BookOpen, BookMarked, CheckSquare, Square, Loader2, Sparkles } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/lib/i18n";
import { NCTB_GRADES, getCatalogBooksByGrade, NctbBookItem } from "@/lib/nctb-catalog";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onClassCreated,
}: CreateClassModalProps) {
  const { currentUser } = useUser();
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState<string>("Class 6");
  const [activeVersion, setActiveVersion] = useState<"bangla" | "english">("bangla");
  const [availableBooks, setAvailableBooks] = useState<NctbBookItem[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveVersion("bangla");
      loadBooksForGrade(gradeLevel);
    }
  }, [isOpen]);

  const loadBooksForGrade = async (grade: string) => {
    try {
      setIsLoadingBooks(true);
      const res = await fetch(`/api/nctb/books?grade=${encodeURIComponent(grade)}`);
      if (res.ok) {
        const data = await res.json();
        const books: NctbBookItem[] = data.books || [];
        setAvailableBooks(books);
        const banglaOnly = books.filter(
          (b) => (b.version || (b.id.includes("-en-") ? "english" : "bangla")) === "bangla"
        );
        setSelectedBookIds(banglaOnly.map((b) => b.id)); // default to bangla version books
      } else {
        const fallback = getCatalogBooksByGrade(grade);
        setAvailableBooks(fallback);
        const banglaOnly = fallback.filter(
          (b) => (b.version || (b.id.includes("-en-") ? "english" : "bangla")) === "bangla"
        );
        setSelectedBookIds(banglaOnly.map((b) => b.id));
      }
    } catch (e) {
      console.error("Error fetching grade books:", e);
      const fallback = getCatalogBooksByGrade(grade);
      setAvailableBooks(fallback);
      const banglaOnly = fallback.filter(
        (b) => (b.version || (b.id.includes("-en-") ? "english" : "bangla")) === "bangla"
      );
      setSelectedBookIds(banglaOnly.map((b) => b.id));
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const banglaAvailableBooks = useMemo(() => {
    return availableBooks.filter(
      (b) => (b.version || (b.id.includes("-en-") ? "english" : "bangla")) === "bangla"
    );
  }, [availableBooks]);

  const englishAvailableBooks = useMemo(() => {
    return availableBooks.filter(
      (b) => (b.version || (b.id.includes("-en-") ? "english" : "bangla")) === "english"
    );
  }, [availableBooks]);

  const currentVersionBooks =
    activeVersion === "bangla" ? banglaAvailableBooks : englishAvailableBooks;

  const allCurrentSelected =
    currentVersionBooks.length > 0 &&
    currentVersionBooks.every((b) => selectedBookIds.includes(b.id));

  const handleSelectAllCurrent = () => {
    const ids = currentVersionBooks.map((b) => b.id);
    setSelectedBookIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllCurrent = () => {
    const ids = new Set(currentVersionBooks.map((b) => b.id));
    setSelectedBookIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const handleGradeChange = (newGrade: string) => {
    setGradeLevel(newGrade);
    loadBooksForGrade(newGrade);
  };

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === "bn" ? "ক্লাসের নাম লিখুন।" : "Please enter a class name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim() || undefined,
          gradeLevel,
          textbookIds: selectedBookIds,
          teacherId: currentUser?.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create classroom");
      }

      setName("");
      setSubject("");
      onClassCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allSelected =
    availableBooks.length > 0 &&
    availableBooks.every((b) => selectedBookIds.includes(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("createClass", "Create Classroom")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "bn"
                  ? "নতুন ক্লাস তৈরি করুন এবং জাতীয় শিক্ষাক্রম বোর্ড বই সংযুক্ত করুন"
                  : "Set up a collaborative space and link NCTB textbooks"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {language === "bn" ? "ক্লাসের নাম" : "Class Name"}
            </label>
            <input
              type="text"
              placeholder="e.g. Class 9 A (বা নবম শ্রেণি ক শাখা)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {language === "bn" ? "বিষয় / বিভাগ" : "Subject / Department"}
              </label>
              <input
                type="text"
                placeholder="e.g. All, Science, or General"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t("gradeLevel", "Grade Level")}
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              >
                {NCTB_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g} ({language === "bn" ? `${g.replace("Class ", "")}ম শ্রেণি` : g})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recommended NCTB Textbooks Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t("recommendedBooks", "Recommended NCTB Textbooks")} ({currentVersionBooks.length})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={allCurrentSelected ? handleDeselectAllCurrent : handleSelectAllCurrent}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {allCurrentSelected ? (
                    <>
                      <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {t("deselectAll", "Deselect All")}
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {t("selectAll", "Select All")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2-Way Version Tabs */}
            <div className="mt-3 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-700/60 grid grid-cols-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveVersion("bangla")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeVersion === "bangla"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span>বাংলা ভার্সন</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {banglaAvailableBooks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveVersion("english")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  activeVersion === "english"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <span>English Version</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {englishAvailableBooks.length}
                </span>
              </button>
            </div>

            <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingBooks ? (
                <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  {language === "bn" ? "পাঠ্যপুস্তক লোড হচ্ছে..." : "Loading textbooks..."}
                </div>
              ) : currentVersionBooks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  {language === "bn" ? "কোনো বই পাওয়া যায়নি।" : "No books found for this version."}
                </div>
              ) : (
                currentVersionBooks.map((book) => {
                  const isChecked = selectedBookIds.includes(book.id);
                  return (
                    <label
                      key={book.id}
                      onClick={() => handleToggleBook(book.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer text-left select-none ${
                        isChecked
                          ? "border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40"
                          : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate block">
                          {book.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {book.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {book.grade}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" strokeWidth={1.75} />
              <span>{language === "bn" ? "স্বয়ংক্রিয় চ্যানেল ও কোড" : "Auto-Provisioned Channels"}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === "bn"
                ? "নতুন ক্লাসে স্বয়ংক্রিয়ভাবে #announcements, #lab-help, #general চ্যানেল এবং ৬-সংখ্যার ইউনিক ক্লাস কোড তৈরি হবে।"
                : "Your new classroom will automatically include #announcements, #lab-help, and #general, plus an auto-generated 6-character class code."}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              {t("cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? t("submitting", "Creating...") : t("createClass", "Create Classroom")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
