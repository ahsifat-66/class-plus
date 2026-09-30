"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "bn" | "en";

export interface Translations {
  [key: string]: {
    bn: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & General
  platformTitle: { bn: "ক্লাসপ্লাস", en: "ClassPulse" },
  platformSubtitle: { bn: "একাডেমিক কোলাবোরেশন প্ল্যাটফর্ম", en: "Academic Collaboration Platform" },

  // Navigation
  navClasses: { bn: "ক্লাসসমূহ", en: "Classes" },
  navTeaching: { bn: "শিক্ষক হিসেবে", en: "Teaching" },
  navEnrolled: { bn: "শিক্ষার্থী হিসেবে", en: "Enrolled" },
  navDeadlines: { bn: "ডেডলাইন", en: "Deadlines" },
  navAnalytics: { bn: "এনালিটিক্স", en: "Analytics" },
  navBookShelf: { bn: "বোর্ড বই", en: "BookShelf" },
  navLocker: { bn: "লকার", en: "Locker" },
  navNoteBox: { bn: "নোটবক্স", en: "NoteBox" },
  navProfile: { bn: "প্রোফাইল", en: "Profile" },
  navSettings: { bn: "সেটিংস", en: "Settings" },
  navLogout: { bn: "লগআউট", en: "Log Out" },

  // Actions
  createClass: { bn: "ক্লাস তৈরি", en: "Create Class" },
  joinClass: { bn: "ক্লাসে যোগ দিন", en: "Join Class" },
  editClass: { bn: "ক্লাস এডিট", en: "Edit Class" },
  saveChanges: { bn: "পরিবর্তন সংরক্ষণ", en: "Save Changes" },
  cancel: { bn: "বাতিল", en: "Cancel" },
  delete: { bn: "মুছে ফেলুন", en: "Delete" },
  confirm: { bn: "নিশ্চিত করুন", en: "Confirm" },
  leaveClass: { bn: "ক্লাস ত্যাগ করুন", en: "Leave Class" },
  exportGradebook: { bn: "গ্রেডবুক এক্সপোর্ট", en: "Export Gradebook" },
  addBooks: { bn: "বই যুক্ত করুন", en: "Add Books" },
  selectAll: { bn: "সব সিলেক্ট করুন", en: "Select All" },
  deselectAll: { bn: "সব বাদ দিন", en: "Deselect All" },
  shareNote: { bn: "নোট শেয়ার", en: "Share Note" },
  generateQuiz: { bn: "কুইজ তৈরি", en: "Generate Quiz" },
  submit: { bn: "জমা দিন", en: "Submit" },
  submitting: { bn: "জমা হচ্ছে...", en: "Submitting..." },
  draftWithAi: { bn: "এআই দিয়ে লিখুন", en: "Draft with AI" },
  joinLecture: { bn: "লেকচারে যোগ দিন", en: "Join Lecture" },
  copied: { bn: "কপি হয়েছে!", en: "Copied!" },
  copyCode: { bn: "কোড কপি করুন", en: "Copy Code" },

  // Classroom Hub Tabs
  tabStream: { bn: "স্ট্রিম", en: "Stream" },
  tabClasswork: { bn: "ক্লাসওয়ার্ক", en: "Classwork" },
  tabQuizzes: { bn: "কুইজ", en: "Quizzes" },
  tabChannels: { bn: "আলোচনা চ্যানেল", en: "Discussion Channels" },
  tabBookShelf: { bn: "বোর্ড বই", en: "BookShelf" },
  tabNoteBox: { bn: "নোটবক্স", en: "NoteBox" },
  tabPeople: { bn: "সহপাঠী ও শিক্ষক", en: "People" },

  // BookShelf
  bookshelfTitle: { bn: "জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) বই", en: "NCTB Curriculum Textbooks" },
  bookshelfSubtitle: { bn: "ক্লাসের জন্য নির্ধারিত বোর্ড বই সরাসরি অনলাইনে পড়ুন বা ডাউনলোড করুন।", en: "Read curriculum-approved textbooks online or download offline copies." },
  readOnline: { bn: "অনলাইনে পড়ুন", en: "Read Online" },
  download: { bn: "ডাউনলোড", en: "Download" },
  recommendedBooks: { bn: "সুপারিশকৃত বোর্ড বই", en: "Recommended NCTB Textbooks" },
  noBooksAssigned: { bn: "এই ক্লাসে কোনো বোর্ড বই যুক্ত করা হয়নি", en: "No textbooks linked to this classroom yet" },
  noBooksHint: { bn: "ক্লাস সেটিংসে গিয়ে নির্ধারিত শ্রেণির বোর্ড বই যুক্ত করুন।", en: "Edit the classroom settings to assign NCTB curriculum textbooks." },

  // Quiz Taking & Generator
  timeRemaining: { bn: "বাকি সময়", en: "Time Remaining" },
  question: { bn: "প্রশ্ন", en: "Question" },
  options: { bn: "অপশন", en: "Options" },
  score: { bn: "প্রাপ্ত নম্বর", en: "Score" },
  reviewAnswers: { bn: "উত্তরপত্র দেখুন", en: "Review Answers" },
  submitQuiz: { bn: "কুইজ জমা দিন", en: "Submit Quiz" },
  startQuiz: { bn: "কুইজ শুরু করুন", en: "Start Quiz" },
  autoGraded: { bn: "স্বয়ংক্রিয় মূল্যায়ন", en: "Auto-Graded" },
  correct: { bn: "সঠিক", en: "Correct" },
  incorrect: { bn: "ভুল", en: "Incorrect" },
  generateWithAi: { bn: "এআই দিয়ে প্রশ্ন তৈরি", en: "Generate with Gemini AI" },
  chapterOrTopic: { bn: "অধ্যায় বা বিষয়", en: "Chapter / Topic" },
  gradeLevel: { bn: "শ্রেণি / গ্রেড", en: "Grade Level" },
  selectSubject: { bn: "বিষয় নির্বাচন করুন", en: "Select Subject" },
  selectGrade: { bn: "শ্রেণি নির্বাচন করুন", en: "Select Grade Level" },
  noQuizzesYet: { bn: "এখনও কোনো কুইজ নেই", en: "No quizzes published yet" },
  quizDescription: { bn: "টাইমারযুক্ত কুইজ এবং তাত্ক্ষণিক স্বয়ংক্রিয় মূল্যায়ন।", en: "Timed assessments with instant automated evaluation." },

  // Stream & Announcements
  announcements: { bn: "বিজ্ঞপ্তি", en: "Announcements" },
  createAnnouncement: { bn: "বিজ্ঞপ্তি তৈরি করুন", en: "Create Announcement" },
  editAnnouncement: { bn: "বিজ্ঞপ্তি এডিট", en: "Edit Announcement" },
  deleteAnnouncement: { bn: "বিজ্ঞপ্তি মুছে ফেলুন", en: "Delete Announcement" },
  edited: { bn: "সম্পাদিত", en: "edited" },
  noAnnouncements: { bn: "এখনও কোনো বিজ্ঞপ্তি দেওয়া হয়নি", en: "No announcements posted yet" },

  // Roles & Badges
  teacherRole: { bn: "শিক্ষক", en: "Instructor" },
  studentRole: { bn: "শিক্ষার্থী", en: "Student" },
  youBadge: { bn: "আপনি", en: "You" },
  enrolledStudents: { bn: "সংযুক্ত শিক্ষার্থী", en: "Enrolled Students" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "bn",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");

  useEffect(() => {
    // Load persisted language from localStorage or cookie
    try {
      const stored = localStorage.getItem("classpulse_language") as Language | null;
      if (stored === "bn" || stored === "en") {
        setLanguageState(stored);
      } else {
        // Default to Bengali
        setLanguageState("bn");
        localStorage.setItem("classpulse_language", "bn");
      }
    } catch (e) {
      setLanguageState("bn");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("classpulse_language", lang);
      document.cookie = `classpulse_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn");
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Reusable Language Switcher component [ বাংলা | English ]
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 text-xs font-semibold shadow-inner ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          language === "bn"
            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
        title="বাংলা ভাষায় ব্যবহার করুন"
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          language === "en"
            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
        title="Switch to English"
      >
        English
      </button>
    </div>
  );
}
