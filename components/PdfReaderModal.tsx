"use client";

import React, { useState } from "react";
import { X, ExternalLink, Download, BookMarked, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface PdfReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
  grade?: string;
  subject?: string;
}

export default function PdfReaderModal({
  isOpen,
  onClose,
  title,
  pdfUrl,
  grade,
  subject,
}: PdfReaderModalProps) {
  const { t, language } = useLanguage();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  // Format viewer URL: if already google drive preview, use it, else docs viewer
  let viewerUrl = pdfUrl;
  if (!viewerUrl.includes("drive.google.com") && !viewerUrl.includes("docs.google.com")) {
    viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-2 sm:inset-4 z-50 w-auto h-auto max-w-none"
            : "w-full max-w-5xl h-[88vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookMarked className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {subject && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {subject}
                  </span>
                )}
                {grade && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {grade}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
              title={t("download", "Download / Open")}
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">{t("download", "Download")}</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Maximize2 className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <button
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Reader */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden rounded-b-2xl sm:rounded-b-3xl">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50/90 dark:bg-slate-900/90 z-10">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs font-medium">
                {language === "bn" ? "পাঠ্যপুস্তক প্রস্তুত হচ্ছে..." : "Loading textbook..."}
              </p>
            </div>
          )}

          <iframe
            src={viewerUrl}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
