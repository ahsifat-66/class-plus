"use client";

import React, { useState } from "react";
import { UserMinus, AlertTriangle, Eye, EyeOff, X, Loader2 } from "lucide-react";

interface RemoveStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  student: {
    id: string;
    name: string;
    email: string;
  } | null;
  onStudentRemoved: () => void;
}

export default function RemoveStudentModal({
  isOpen,
  onClose,
  classroomId,
  student,
  onStudentRemoved,
}: RemoveStudentModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !student) return null;

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter your account password to verify removal.");
      return;
    }

    try {
      setIsRemoving(true);
      setError("");

      const res = await fetch(`/api/classrooms/${classroomId}/members/${student.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove student from classroom");
      }

      onStudentRemoved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Incorrect account password. Verification failed.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white dark:bg-slate-900 dark:border-red-900/40 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60">
              <UserMinus className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Remove Student
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Un-enroll student from classroom roster
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

        <form onSubmit={handleRemove} className="mt-4 space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-900/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-semibold">
              Un-enroll {student.name} ({student.email})?
            </p>
            <p className="text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
              The student will lose access to course materials, channels, and assignments unless re-enrolled using the course code.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Confirm Instructor Password
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
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-10 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                disabled={isRemoving}
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
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRemoving || !password.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-red-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <UserMinus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Confirm &amp; Remove</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
