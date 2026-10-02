"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Linkedin,
  Github,
  Mail,
  ExternalLink,
  Code2,
  Sparkles,
  Quote,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface AboutCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutCreatorModal({
  isOpen,
  onClose,
}: AboutCreatorModalProps) {
  const { language } = useLanguage();
  const [activeStoryTab, setActiveStoryTab] = useState<"en" | "bn">(language === "bn" ? "bn" : "en");
  const [imgError, setImgError] = useState(false);

  // Sync tab with global language on open
  useEffect(() => {
    if (isOpen) {
      setActiveStoryTab(language === "bn" ? "bn" : "en");
    }
  }, [isOpen, language]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const techBadges = [
    "React",
    "Next.js",
    "Firebase",
    "Gemini AI",
    "NCTB Curriculum",
    "Tailwind CSS",
    "TypeScript",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg my-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Subtle Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />

        {/* Top Header with Close Button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <Code2 size={13} />
            <span>Creator Profile</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all active:scale-95"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 pt-3 overflow-y-auto space-y-6">
          {/* Header & Profile Details */}
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Avatar Container with Guaranteed Inline Styles */}
            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-4 border-indigo-500/20 shadow-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {!imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="https://github.com/ahsifat-66.png"
                  alt="Md Abid Hasan Sifat"
                  onError={() => setImgError(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 15%",
                  }}
                />
              ) : (
                <div className="flex w-full h-full items-center justify-center bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl">
                  AS
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                <span>Md Abid Hasan Sifat</span>
                <Sparkles size={18} className="text-amber-500 shrink-0" />
              </h2>
              <p className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                Founder & Lead Developer, ClassPulse
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                <MapPin size={13} className="text-rose-500" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* The Vision & Story Section */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-3">
            {/* Story Header & Language Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Quote size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>{language === "bn" ? "উদ্দেশ্য ও দর্শন" : "The Vision & Story"}</span>
              </div>

              {/* Language Switcher Tabs */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveStoryTab("en")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeStoryTab === "en"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStoryTab("bn")}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeStoryTab === "bn"
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Story Quote Text */}
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              {activeStoryTab === "en" ? (
                <p>
                  &ldquo;I created ClassPulse to transform passive digital classrooms into intelligent, active learning ecosystems. My vision is to empower students and teachers across Bangladesh with instant access to the NCTB curriculum, automated assessments, and a 24/7 Socratic AI mentor that guides problem-solving step by step.&rdquo;
                </p>
              ) : (
                <p>
                  &ldquo;প্রথাগত শ্রেণিকক্ষের সীমাবদ্ধতা ভেঙে প্রতিটি শিক্ষার্থীর কাছে আধুনিক এআই-ভিত্তিক শিক্ষা পৌঁছে দিতেই ClassPulse-এর জন্ম। আমার লক্ষ্য ছিল এমন একটি প্ল্যাটফর্ম তৈরি করা, যেখানে জাতীয় শিক্ষাক্রমের পাঠ্যবই আগে থেকেই সাজানো থাকবে এবং শিক্ষক ছাড়াই পড়ার টেবিলে আটকে গেলে কৃত্রিম বুদ্ধিমত্তা একজন সার্বক্ষণিক পথপ্রদর্শক হিসেবে শিক্ষার্থীদের লজিক ও হিন্ট দিয়ে সাহায্য করবে।&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Tech Stack Badges */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Code2 size={13} className="text-indigo-500" />
              <span>Core Tech Stack</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {techBadges.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 shadow-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Connect Links */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Connect with Creator
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* LinkedIn Button */}
              <a
                href="https://www.linkedin.com/in/a-h-sifat/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] dark:text-sky-300 border border-[#0077B5]/20 transition-all font-bold text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Linkedin size={16} />
                  <span>LinkedIn Profile</span>
                </div>
                <ExternalLink size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>

              {/* GitHub Button */}
              <a
                href="https://github.com/ahsifat-66"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition-all font-bold text-xs group"
              >
                <div className="flex items-center gap-2">
                  <Github size={16} />
                  <span>GitHub Profile</span>
                </div>
                <ExternalLink size={13} className="opacity-60 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>

            {/* Email Button */}
            <a
              href="mailto:abidhasansifat66@gmail.com"
              className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/20 transition-all font-semibold text-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={16} className="shrink-0" />
                <span className="truncate">abidhasansifat66@gmail.com</span>
              </div>
              <ExternalLink size={13} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
