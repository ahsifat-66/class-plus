"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Settings,
  BookMarked,
  CheckSquare,
  Square,
  Loader2,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { booksData, flatBooksData, Book } from "@/data/booksData";
import { nctbBooksData } from "@/data/textbooksData";

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

type GroupType = "science" | "business_studies" | "humanities" | "";

export default function EditClassModal({
  isOpen,
  onClose,
  classroom,
  onClassUpdated,
}: EditClassModalProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState(classroom.name);
  const [subject, setSubject] = useState(classroom.subject);
  const [gradeLevel, setGradeLevel] = useState<string>("Class 6");
  const [selectedGroup, setSelectedGroup] = useState<GroupType>("");
  const [activeVersion, setActiveVersion] = useState<"bangla" | "english">("bangla");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync state whenever modal opens or classroom changes
  useEffect(() => {
    if (isOpen) {
      setName(classroom.name);
      setSubject(classroom.subject);

      // Normalize incoming gradeLevel
      let initialGrade = classroom.gradeLevel || "Class 6";
      const gLower = initialGrade.toLowerCase();
      if (gLower.includes("9") || gLower.includes("10")) {
        initialGrade = "Class 9-10";
      } else if (gLower.includes("11") || gLower.includes("12")) {
        initialGrade = "Class 11-12";
      }
      setGradeLevel(initialGrade);

      // Handle conditional group detection
      if (initialGrade === "Class 9-10" || initialGrade === "Class 11-12") {
        const existingIds = (classroom.textbooks || []).map((b) => b.id);
        const subj = (classroom.subject || "").toLowerCase();
        if (
          existingIds.some((id) =>
            [
              "acc",
              "bus_ent",
              "fin",
              "agri",
              "home_sci",
              "gen_sci",
              "ev_acc",
              "ev_fin",
              "ev_bus_ent",
              "ev_sci",
              "ev_agri",
              "ev_home_sci",
            ].includes(id)
          ) ||
          subj.includes("business") ||
          subj.includes("commerce") ||
          subj.includes("ব্যবসায়")
        ) {
          setSelectedGroup("business_studies");
        } else if (
          existingIds.some((id) =>
            [
              "hist",
              "geo",
              "civ",
              "econ",
              "agri_hum",
              "home_sci_hum",
              "gen_sci_hum",
              "ev_hist",
              "ev_geo",
              "ev_civ",
              "ev_econ",
              "ev_sci_hum",
              "ev_agri_hum",
              "ev_home_sci_hum",
            ].includes(id)
          ) ||
          subj.includes("arts") ||
          subj.includes("humanities") ||
          subj.includes("মানবিক")
        ) {
          setSelectedGroup("humanities");
        } else {
          setSelectedGroup("science");
        }
      } else {
        setSelectedGroup("");
      }

      setActiveVersion("bangla");
      const existingIds = (classroom.textbooks || []).map((b) => b.id);
      setSelectedBookIds(existingIds);
      setError("");
    }
  }, [isOpen, classroom]);

  const isGroupApplicable = gradeLevel === "Class 9-10" || gradeLevel === "Class 11-12";

  const handleGradeChange = (newGrade: string) => {
    setGradeLevel(newGrade);
    if (newGrade === "Class 9-10" || newGrade === "Class 11-12") {
      // Show group dropdown and default to Science if not set
      setSelectedGroup((prev) => (prev ? prev : "science"));
    } else {
      // Hide group dropdown and clear selected group
      setSelectedGroup("");
    }
  };

  const handleGroupChange = (newGroup: string) => {
    setSelectedGroup(newGroup as GroupType);
  };

  const getGroupLabel = (group: GroupType) => {
    switch (group) {
      case "science":
        return "Science (বিজ্ঞান)";
      case "business_studies":
        return "Business Studies (ব্যবসায় শিক্ষা)";
      case "humanities":
        return "Humanities (মানবিক)";
      default:
        return "Science (বিজ্ঞান)";
    }
  };

  // Class 6 Books
  const class6BanglaBooks = useMemo(
    () => booksData[0]?.versions.banglaVersion || [],
    []
  );
  const class6EnglishBooks = useMemo(
    () => booksData[0]?.versions.englishVersion || [],
    []
  );

  // Class 9-10 Compulsory Books for active version
  const class910CompulsoryBooks = useMemo(() => {
    const vKey = activeVersion === "bangla" ? "bn" : "en";
    return nctbBooksData["9-10"]?.[vKey]?.compulsory || [];
  }, [activeVersion]);

  // Class 9-10 Group Books for active version and selected group
  const class910GroupBooks = useMemo(() => {
    const vKey = activeVersion === "bangla" ? "bn" : "en";
    const grpKey = (selectedGroup || "science") as "science" | "business_studies" | "humanities";
    return nctbBooksData["9-10"]?.[vKey]?.groups?.[grpKey] || [];
  }, [activeVersion, selectedGroup]);

  // Dynamic counts for version tabs
  const class910BanglaCount = useMemo(() => {
    const comp = nctbBooksData["9-10"]?.bn?.compulsory?.length || 0;
    const grpKey = (selectedGroup || "science") as "science" | "business_studies" | "humanities";
    const grp = nctbBooksData["9-10"]?.bn?.groups?.[grpKey]?.length || 0;
    return comp + grp;
  }, [selectedGroup]);

  const class910EnglishCount = useMemo(() => {
    const comp = nctbBooksData["9-10"]?.en?.compulsory?.length || 0;
    const grpKey = (selectedGroup || "science") as "science" | "business_studies" | "humanities";
    const grp = nctbBooksData["9-10"]?.en?.groups?.[grpKey]?.length || 0;
    return comp + grp;
  }, [selectedGroup]);

  // All books currently visible in the active view
  const currentViewBooks = useMemo(() => {
    if (gradeLevel === "Class 9-10") {
      return [...class910CompulsoryBooks, ...class910GroupBooks];
    }
    if (gradeLevel === "Class 6") {
      return activeVersion === "bangla"
        ? class6BanglaBooks.map((b) => ({ id: b.id, title: b.title, url: b.driveUrl, subject: b.subject }))
        : class6EnglishBooks.map((b) => ({ id: b.id, title: b.title, url: b.driveUrl, subject: b.subject }));
    }
    return [];
  }, [gradeLevel, activeVersion, class910CompulsoryBooks, class910GroupBooks, class6BanglaBooks, class6EnglishBooks]);

  // Bulk Selection Status for the currently active tab
  const allCurrentSelected =
    currentViewBooks.length > 0 &&
    currentViewBooks.every((b) => selectedBookIds.includes(b.id));

  const handleSelectAllCurrent = () => {
    const ids = currentViewBooks.map((b) => b.id);
    setSelectedBookIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAllCurrent = () => {
    const ids = new Set(currentViewBooks.map((b) => b.id));
    setSelectedBookIds((prev) => prev.filter((id) => !ids.has(id)));
  };

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
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
      console.error("Error updating classroom:", err);
      setError(err.message || "Failed to update classroom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable Textbook Item Card
  const renderTextbookCard = (book: { id: string; title: string; url?: string; subject?: string }) => {
    const isChecked = selectedBookIds.includes(book.id);
    return (
      <div
        key={book.id}
        onClick={() => handleToggleBook(book.id)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          isChecked
            ? "border-indigo-400 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm"
            : "border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => {}} // handled by parent div
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
          />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {book.title}
            </p>
            {book.subject && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5 inline-block">
                {book.subject}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {book.url && (
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900/40 transition-colors"
              title="Open in Google Drive"
            >
              <ExternalLink size={11} />
              <span>{language === "bn" ? "বই দেখুন" : "View PDF"}</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
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
                <option value="Class 6">Class 6 (৬ষ্ঠ শ্রেণি)</option>
                <option value="Class 1">Class 1 (১ম শ্রেণি)</option>
                <option value="Class 2">Class 2 (২য় শ্রেণি)</option>
                <option value="Class 3">Class 3 (৩য় শ্রেণি)</option>
                <option value="Class 4">Class 4 (৪র্থ শ্রেণি)</option>
                <option value="Class 5">Class 5 (৫ম শ্রেণি)</option>
                <option value="Class 7">Class 7 (৭ম শ্রেণি)</option>
                <option value="Class 8">Class 8 (৮ম শ্রেণি)</option>
                <option value="Class 9-10">Class 9-10 (৯ম-১০ম শ্রেণি)</option>
                <option value="Class 11-12">Class 11-12 (একাদশ-দ্বাদশ শ্রেণি)</option>
              </select>
            </div>
          </div>

          {/* Conditional Group Selection Dropdown (Only for Class 9-10 or Class 11-12) */}
          {isGroupApplicable && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>GROUP / বিভাগ</span>
              </label>
              <select
                value={selectedGroup || "science"}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
              >
                <option value="science">Science (বিজ্ঞান)</option>
                <option value="business_studies">Business Studies (ব্যবসায় শিক্ষা)</option>
                <option value="humanities">Humanities (মানবিক)</option>
              </select>
            </div>
          )}

          {/* Recommended NCTB Textbooks Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t("recommendedBooks", "Recommended NCTB Textbooks")} ({currentViewBooks.length})
                </h4>
              </div>

              {/* Version-Scoped Select All / Deselect All */}
              {currentViewBooks.length > 0 && (
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
              )}
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
                {gradeLevel === "Class 9-10" && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {class910BanglaCount}
                  </span>
                )}
                {gradeLevel === "Class 6" && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {class6BanglaBooks.length}
                  </span>
                )}
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
                {gradeLevel === "Class 9-10" && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {class910EnglishCount}
                  </span>
                )}
                {gradeLevel === "Class 6" && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {class6EnglishBooks.length}
                  </span>
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {language === "bn"
                ? "নির্বাচিত বইগুলো শিক্ষার্থীদের 'বোর্ড বই' (BookShelf) ট্যাবে তাৎক্ষণিক উন্মুক্ত হবে।"
                : "Selected textbooks will appear directly in the student BookShelf tab."}
            </p>

            {/* Book Checkboxes Grid */}
            <div className="mt-3 max-h-60 overflow-y-auto space-y-3 pr-1">
              {/* CLASS 9-10 POPULATION */}
              {gradeLevel === "Class 9-10" ? (
                <div className="space-y-4">
                  {/* আবশ্যিক বিষয় (Compulsory Subjects) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {language === "bn"
                          ? "আবশ্যিক বিষয় (Compulsory Subjects)"
                          : "Compulsory Subjects (আবশ্যিক বিষয়)"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {class910CompulsoryBooks.length} {language === "bn" ? "টি বিষয়" : "subjects"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {class910CompulsoryBooks.map((b) => renderTextbookCard(b))}
                    </div>
                  </div>

                  {/* বিভাগীয় বিষয় (Group Subjects) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {language === "bn" ? "বিভাগীয় বিষয়" : "Group Subjects"} ({getGroupLabel(selectedGroup)})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {class910GroupBooks.length} {language === "bn" ? "টি বিষয়" : "subjects"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {class910GroupBooks.map((b) => renderTextbookCard(b))}
                    </div>
                  </div>
                </div>
              ) : gradeLevel === "Class 6" ? (
                /* CLASS 6 POPULATION */
                <div className="space-y-1.5">
                  {currentViewBooks.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      {language === "bn" ? "কোনো বই পাওয়া যায়নি।" : "No books found for this version."}
                    </div>
                  ) : (
                    currentViewBooks.map((b) => renderTextbookCard(b))
                  )}
                </div>
              ) : (
                /* OTHER GRADES */
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl">
                  {language === "bn"
                    ? "এই শ্রেণির পাঠ্যবই শীঘ্রই উপলব্ধ হবে।"
                    : "Curriculum textbooks for this grade will be available soon."}
                </div>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{language === "bn" ? "নির্বাচিত বই:" : "Selected:"} </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {selectedBookIds.length} {language === "bn" ? "টি" : "books"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
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
          </div>
        </form>
      </div>
    </div>
  );
}
