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
  ExternalLink,
  Layers,
  GraduationCap,
  Sparkles,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { booksData, flatBooksData, Book } from "@/data/booksData";
import { textbooksData } from "@/data/textbooksData";

interface AssignBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  gradeLevel?: string | null;
  currentBookIds?: string[];
  onSuccess: (updatedBookIds: string[]) => void;
}

type GroupType = "science" | "commerce" | "arts";

export default function AssignBooksModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  gradeLevel,
  currentBookIds = [],
  onSuccess,
}: AssignBooksModalProps) {
  const { language } = useLanguage();

  // Selection state (all selected book IDs across all grades/groups)
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("9-10");
  const [selectedGroup, setSelectedGroup] = useState<GroupType>("science");
  const [activeVersion, setActiveVersion] = useState<"bangla" | "english">("bangla");
  const [searchQuery, setSearchQuery] = useState("");

  // Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state whenever modal opens or currentBookIds change
  useEffect(() => {
    if (isOpen) {
      setSelectedBookIds(currentBookIds);
      setSearchQuery("");
      setError("");

      // Intelligent grade detection
      if (gradeLevel) {
        const g = gradeLevel.toLowerCase();
        if (g.includes("9") || g.includes("10")) {
          setSelectedGrade("9-10");
        } else if (g.includes("6")) {
          setSelectedGrade("class-6");
        } else if (g.includes("7")) {
          setSelectedGrade("class-7");
        } else if (g.includes("8")) {
          setSelectedGrade("class-8");
        } else if (g.includes("11") || g.includes("12")) {
          setSelectedGrade("11-12");
        } else {
          setSelectedGrade("9-10");
        }
      } else if (currentBookIds.some((id) => id.startsWith("c910-"))) {
        setSelectedGrade("9-10");
      } else if (currentBookIds.some((id) => id.startsWith("c6-"))) {
        setSelectedGrade("class-6");
      } else {
        setSelectedGrade("9-10");
      }

      // Group detection for 9-10
      if (currentBookIds.some((id) => id.includes("comm-"))) {
        setSelectedGroup("commerce");
      } else if (currentBookIds.some((id) => id.includes("arts-"))) {
        setSelectedGroup("arts");
      } else {
        setSelectedGroup("science");
      }

      setActiveVersion("bangla");
    }
  }, [isOpen, currentBookIds, gradeLevel]);

  // Class 6 Books
  const class6BanglaBooks: Book[] = useMemo(
    () => booksData[0]?.versions.banglaVersion || [],
    []
  );
  const class6EnglishBooks: Book[] = useMemo(
    () => booksData[0]?.versions.englishVersion || [],
    []
  );

  // Class 9-10 Compulsory Books
  const compulsoryBooks: Book[] = useMemo(() => {
    const list = textbooksData["9-10"]?.compulsory || [];
    return list.map((c) => ({
      id: c.id!,
      title: c.name,
      subject: c.subject || "General",
      driveUrl: c.link,
      grade: "Class 9-10",
      version: "bangla" as const,
    }));
  }, []);

  // Class 9-10 Group-Specific Books
  const groupBooks: Book[] = useMemo(() => {
    const grp = textbooksData["9-10"]?.groups?.[selectedGroup];
    if (!grp) return [];
    return (grp.books || []).map((b) => ({
      id: b.id!,
      title: b.name,
      subject: b.subject || grp.label.split(" ")[0] || "Group Subject",
      driveUrl: b.link,
      grade: "Class 9-10",
      version: "bangla" as const,
    }));
  }, [selectedGroup]);

  // Active group label
  const activeGroupLabel = useMemo(() => {
    if (selectedGroup === "science") return "বিজ্ঞান (Science)";
    if (selectedGroup === "commerce") return "ব্যবসায় শিক্ষা (Commerce)";
    return "মানবিক (Arts)";
  }, [selectedGroup]);

  // Check if active grade has groups
  const hasGroupSelection = selectedGrade === "9-10" || selectedGrade === "11-12";

  // Filtered books for Class 9-10
  const filteredCompulsory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return compulsoryBooks;
    return compulsoryBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
    );
  }, [compulsoryBooks, searchQuery]);

  const filteredGroupBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groupBooks;
    return groupBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
    );
  }, [groupBooks, searchQuery]);

  // Filtered books for Class 6
  const currentClass6Books = activeVersion === "bangla" ? class6BanglaBooks : class6EnglishBooks;
  const filteredClass6Books = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentClass6Books;
    return currentClass6Books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q)
    );
  }, [currentClass6Books, searchQuery]);

  // Currently visible books in the active view
  const currentlyVisibleBooks: Book[] = useMemo(() => {
    if (selectedGrade === "9-10") {
      return [...filteredCompulsory, ...filteredGroupBooks];
    }
    if (selectedGrade === "class-6") {
      return filteredClass6Books;
    }
    return [];
  }, [selectedGrade, filteredCompulsory, filteredGroupBooks, filteredClass6Books]);

  // Bulk selection status for active view
  const allVisibleSelected =
    currentlyVisibleBooks.length > 0 &&
    currentlyVisibleBooks.every((b) => selectedBookIds.includes(b.id));

  const visibleSelectedCount = useMemo(() => {
    return currentlyVisibleBooks.filter((b) => selectedBookIds.includes(b.id)).length;
  }, [currentlyVisibleBooks, selectedBookIds]);

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = currentlyVisibleBooks.map((b) => b.id);
    setSelectedBookIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = new Set(currentlyVisibleBooks.map((b) => b.id));
    setSelectedBookIds((prev) => prev.filter((id) => !visibleIds.has(id)));
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

  // Reusable Book Card Component
  const renderBookCard = (book: Book) => {
    const isChecked = selectedBookIds.includes(book.id);
    return (
      <div
        key={book.id}
        onClick={() => handleToggleBook(book.id)}
        className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
          isChecked
            ? "border-indigo-400 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm"
            : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-3">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}} // handled by parent div onClick
            className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {book.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {book.subject}
              </span>
              {book.version === "english" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  English
                </span>
              )}
              {book.driveUrl && (
                <a
                  href={book.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/40 transition-colors"
                  title="Open in Google Drive"
                >
                  <ExternalLink size={10} />
                  <span>{language === "bn" ? "বই দেখুন (View Drive PDF)" : "View Drive PDF"}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBook(book.id);
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isChecked
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700"
            }`}
          >
            {isChecked ? (
              <>
                <Check size={13} strokeWidth={2.5} />
                <span>{language === "bn" ? "যুক্ত আছে" : "Added"}</span>
              </>
            ) : (
              <>
                <Plus size={13} strokeWidth={2.5} />
                <span>{language === "bn" ? "সিলেক্ট করুন" : "Add to Curriculum"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
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
        className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col"
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
                {classroomName} • {language === "bn" ? "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB)" : "NCTB National Curriculum"}
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
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 shrink-0">
            {error}
          </div>
        )}

        {/* Grade & Conditional Group Filter Bar */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          {/* Grade Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <GraduationCap size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>{language === "bn" ? "শ্রেণি নির্বাচন করুন (Grade)" : "Select Grade"}</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSearchQuery("");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="9-10">
                {language === "bn" ? "নবম-দশম শ্রেণি (Class 9-10)" : "Class 9-10"}
              </option>
              <option value="class-6">
                {language === "bn" ? "ষষ্ঠ শ্রেণি (Class 6)" : "Class 6"}
              </option>
              <option value="class-7">
                {language === "bn" ? "সপ্তম শ্রেণি (Class 7)" : "Class 7"}
              </option>
              <option value="class-8">
                {language === "bn" ? "অষ্টম শ্রেণি (Class 8)" : "Class 8"}
              </option>
              <option value="11-12">
                {language === "bn" ? "একাদশ-দ্বাদশ শ্রেণি (Class 11-12)" : "Class 11-12"}
              </option>
            </select>
          </div>

          {/* Conditional Group Selector (only when Grade is 9-10 or 11-12) */}
          {hasGroupSelection ? (
            <div className="animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>{language === "bn" ? "বিভাগ নির্বাচন করুন (Group)" : "Select Group"}</span>
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value as GroupType);
                  setSearchQuery("");
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="science">বিজ্ঞান (Science)</option>
                <option value="commerce">ব্যবসায় শিক্ষা (Commerce)</option>
                <option value="arts">মানবিক (Arts)</option>
              </select>
            </div>
          ) : (
            <div className="hidden sm:flex items-center text-xs text-slate-400 italic pl-1 self-end pb-2">
              {language === "bn" ? "এই শ্রেণিতে বিভাগ প্রযোজ্য নয়" : "No groups applicable for this grade"}
            </div>
          )}
        </div>

        {/* Class 6 Version Switcher */}
        {selectedGrade === "class-6" && (
          <div className="mt-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveVersion("bangla")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeVersion === "bangla"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>বাংলা ভার্সন</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                15
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveVersion("english")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeVersion === "english"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>English Version</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                15
              </span>
            </button>
          </div>
        )}

        {/* Search & Bulk selection toolbar */}
        {currentlyVisibleBooks.length > 0 && (
          <div className="mt-3 space-y-2.5 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    language === "bn"
                      ? "পাঠ্যবই খুঁজুন (শিরোনাম বা বিষয়)..."
                      : "Search textbooks by title or subject..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={allVisibleSelected ? handleDeselectAllVisible : handleSelectAllVisible}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {allVisibleSelected ? (
                    <>
                      <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>{language === "bn" ? "বর্তমান পৃষ্ঠার সব বাদ দিন" : "Deselect All"}</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>{language === "bn" ? "বর্তমান পৃষ্ঠার সব নির্বাচন করুন" : "Select All"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Sparkles size={14} className="text-amber-500" />
                <span>
                  {language === "bn"
                    ? "সুপারিশকৃত পাঠ্যবই (Recommended Books)"
                    : "Recommended Books"}
                </span>
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
                {visibleSelectedCount} / {currentlyVisibleBooks.length}{" "}
                {language === "bn" ? "নির্বাচিত" : "selected in view"}
              </span>
            </div>
          </div>
        )}

        {/* Books selection content */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-4 pr-1 min-h-[220px]">
          {/* CLASS 9-10 DISPLAY (Compulsory + Group Specific) */}
          {selectedGrade === "9-10" && (
            <div className="space-y-5">
              {/* Category 1: আবশ্যিক বিষয় (Compulsory Subjects) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {language === "bn" ? "আবশ্যিক বিষয় (Compulsory Subjects)" : "Compulsory Subjects"}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {language === "bn" ? "সকল বিভাগের জন্য সাধারণ" : "Common to all groups"} ({filteredCompulsory.length})
                  </span>
                </div>

                {filteredCompulsory.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    {language === "bn" ? "কোনো আবশ্যিক বিষয় মিল পাওয়া যায়নি।" : "No compulsory subjects match search."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCompulsory.map((book) => renderBookCard(book))}
                  </div>
                )}
              </div>

              {/* Category 2: বিভাগীয় বিষয় (Group Specific Subjects) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {language === "bn"
                        ? `বিভাগীয় বিষয় (${activeGroupLabel})`
                        : `Group Specific Subjects (${activeGroupLabel})`}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {activeGroupLabel} ({filteredGroupBooks.length})
                  </span>
                </div>

                {filteredGroupBooks.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    {language === "bn" ? "কোনো বিভাগীয় বিষয় মিল পাওয়া যায়নি।" : "No group subjects match search."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGroupBooks.map((book) => renderBookCard(book))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CLASS 6 DISPLAY */}
          {selectedGrade === "class-6" && (
            <div className="space-y-2">
              {filteredClass6Books.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {language === "bn" ? "কোনো বই পাওয়া যায়নি।" : "No textbooks match your search."}
                </div>
              ) : (
                filteredClass6Books.map((book) => renderBookCard(book))
              )}
            </div>
          )}

          {/* OTHER GRADES (Coming soon state) */}
          {(selectedGrade === "class-7" || selectedGrade === "class-8" || selectedGrade === "11-12") && (
            <div className="py-14 text-center px-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
                <BookOpen size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {language === "bn"
                  ? "এই শ্রেণির পাঠ্যবই শীঘ্রই উপলব্ধ হবে"
                  : "Curriculum Textbooks Coming Soon"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                {language === "bn"
                  ? "এনসিটিবি (NCTB) অনুমোদিত পাঠ্যবই ডাটাবেসে যুক্ত করার কাজ চলমান রয়েছে।"
                  : "Textbooks for this grade level are being integrated according to official NCTB syllabus."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>{language === "bn" ? "মোট নির্বাচিত বই:" : "Total Selected Textbooks:"} </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedBookIds.length} {language === "bn" ? "টি" : "books"}
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
