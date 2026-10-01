"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language } from "./translations";

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // 1. Load persisted language from localStorage or cookies, default to "en"
    try {
      const stored = localStorage.getItem("classpulse_language") as Language | null;
      if (stored === "bn" || stored === "en") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      } else {
        setLanguageState("en");
        document.documentElement.lang = "en";
        localStorage.setItem("classpulse_language", "en");
      }
    } catch (e) {
      setLanguageState("en");
      if (typeof document !== "undefined") {
        document.documentElement.lang = "en";
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("classpulse_language", lang);
      document.cookie = `classpulse_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof document !== "undefined") {
        document.documentElement.lang = lang;
      }
    } catch (e) {}
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "bn" : "en";
    setLanguage(nextLang);
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
 * Reusable Language Switcher component (legacy or standalone usage)
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
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg transition-all ${
          language === "en"
            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
        title="Switch to English"
      >
        English 🇺🇸
      </button>
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
        বাংলা 🇧🇩
      </button>
    </div>
  );
}
