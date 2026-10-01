"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, BookMarked, CheckSquare, Square, Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { NCTB_GRADES, getCatalogBooksByGrade, NctbBookItem } from "@/lib/nctb-catalog";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: {
    id: string;
    name: string;
    subject: string;
    gradeLevel?: string | null;
    textbooks?: Array<{ id: string; title: string; subject: string; driveUrl?: string | null }>;
  };
  onClassUpdated: () => void;
}

export default function EditClassModal({
  isOpen,
  onClose,
  classroom,
  onClassUpdated,
}: EditClassModalProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState(classroom.name);
  const [subject, setSubject] = useState(classroom.subject);
  const [gradeLevel, setGradeLevel] = useState<string>(classroom.gradeLevel || "Class 6");
  const [availableBooks, setAvailableBooks] = useState<NctbBookItem[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state whenever modal opens or classroom changes
  useEffect(() => {
    if (isOpen) {
      setName(classroom.name);
      setSubject(classroom.subject);
      const initialGrade = classroom.gradeLevel || "Class 6";
      setGradeLevel(initialGrade);
      const existingIds = (classroom.textbooks || []).map((b) => b.id);
      setSelectedBookIds(existingIds);
      loadBooksForGrade(initialGrade, existingIds);
    }
  }, [isOpen, classroom]);

  const loadBooksForGrade = async (grade: string, existingSelectedIds?: string[]) => {
    try {
      setIsLoadingBooks(true);
      const res = await fetch(`/api/nctb/books?grade=${encodeURIComponent(grade)}`);
      if (res.ok) {
        const data = await res.json();
        const books: NctbBookItem[] = data.books || [];
        setAvailableBooks(books);

        // If existing IDs provided, keep those that are still in the list or keep them selected
        if (existingSelectedIds && existingSelectedIds.length > 0) {
          setSelectedBookIds(existingSelectedIds);
        } else {
          // By default, select all recommended books for this newly chosen grade
          setSelectedBookIds(books.map((b) => b.id));
        }
      } else {
        // Fallback to static catalog
        const fallback = getCatalogBooksByGrade(grade);
        setAvailableBooks(fallback);
        if (!existingSelectedIds || existingSelectedIds.length === 0) {
          setSelectedBookIds(fallback.map((b) => b.id));
        }
      }
    } catch (e) {
      console.error("Error fetching grade books:", e);
      const fallback = getCatalogBooksByGrade(grade);
      setAvailableBooks(fallback);
      if (!existingSelectedIds || existingSelectedIds.length === 0) {
        setSelectedBookIds(fallback.map((b) => b.id));
      }
    } finally {
      setIsLoadingBooks(false);
    }
  };

  const handleGradeChange = (newGrade: string) => {
    setGradeLevel(newGrade);
    // Load books for newly selected grade and select all by default
    loadBooksForGrade(newGrade);
  };

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBookIds(availableBooks.map((b) => b.id));
  };

  const handleDeselectAll = () => {
    setSelectedBookIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === "bn" ? "ক্লাসের নাম লিখুন।" : "Please enter a class name.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim() || undefined,
          gradeLevel,
          textbookIds: selectedBookIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update classroom");
      }

      onClassUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update classroom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allSelected =
    availableBooks.length > 0 &&
    availableBooks.every((b) => selectedBookIds.includes(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Settings className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("editClass", "Edit Classroom")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "bn"
                  ? "ক্লাসের বিবরণ ও এনসিটিবি বোর্ড বই পরিচালনা করুন"
                  : "Manage classroom details and NCTB curriculum textbooks"}
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
          {/* Class Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {language === "bn" ? "ক্লাসের নাম" : "Class Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              required
            />
          </div>

          {/* Subject & Grade Level in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {language === "bn" ? "বিষয় / বিভাগ" : "Subject / Department"}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Science, General"
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
                  {t("recommendedBooks", "Recommended NCTB Textbooks")} ({availableBooks.length})
                </h4>
              </div>

              {/* Master Select All / Deselect All */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={allSelected ? handleDeselectAll : handleSelectAll}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {allSelected ? (
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

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {language === "bn"
                ? "নির্বাচিত বইগুলো শিক্ষার্থীদের 'বোর্ড বই' (BookShelf) ট্যাবে তাৎক্ষণিক উন্মুক্ত হবে।"
                : "Selected textbooks will appear directly in the student BookShelf tab."}
            </p>

            {/* Book Checkboxes Grid */}
            <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingBooks ? (
                <div className="py-6 flex items-center justify-center text-xs text-slate-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  {language === "bn" ? "পাঠ্যপুস্তক লোড হচ্ছে..." : "Loading textbooks..."}
                </div>
              ) : availableBooks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  {language === "bn" ? "কোনো বই পাওয়া যায়নি।" : "No books found for this grade."}
                </div>
              ) : (
                availableBooks.map((book) => {
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
                        onChange={() => {}} // handled by label onClick
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {book.title}
                          </span>
                        </div>
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

          {/* Modal Action Buttons */}
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
              {isSubmitting
                ? t("submitting", "Saving...")
                : t("saveChanges", "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
