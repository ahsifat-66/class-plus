"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Lock, Eye, EyeOff, X, Loader2, AlertTriangle } from "lucide-react";

interface LeaveClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  classroomName: string;
  onSuccess?: () => void;
}

export default function LeaveClassroomModal({
  isOpen,
  onClose,
  classroomId,
  classroomName,
  onSuccess,
}: LeaveClassroomModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your account password to verify unenrollment.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect password. Please try again.");
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard?view=enrolled");
      }
    } catch (err: any) {
      setError(err.message || "Incorrect password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/60">
              <LogOut className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Leave Classroom
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unenroll from course roster
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleLeave} className="mt-4 space-y-4">
          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-900/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Are you sure you want to leave {classroomName}?</span>
            </p>
            <p className="text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
              You will lose access to all assignments, class notes, and discussion channels. You can only rejoin if you obtain the course code again.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock size={14} className="text-slate-400" />
              <span>Confirm your password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your account password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {error && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Confirm &amp; Leave Class</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
