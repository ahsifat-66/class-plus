"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Calendar, Award, Check, Users, Search, CheckSquare, Square } from "lucide-react";

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    description: string;
    dueDate: string | Date;
    maxPoints: number;
    assignToAll?: boolean;
    assignedStudentIds?: string[];
  } | null;
  onAssignmentUpdated: () => void;
  students?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  }>;
}

export default function EditAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onAssignmentUpdated,
  students = [],
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [assignToAll, setAssignToAll] = useState(true);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || "");
      setDescription(assignment.description || "");
      if (assignment.dueDate) {
        const d = new Date(assignment.dueDate);
        const iso = d.toISOString();
        // format to YYYY-MM-DDTHH:mm
        setDueDate(iso.slice(0, 16));
      } else {
        setDueDate("");
      }
      setMaxPoints(String(assignment.maxPoints || 100));
      setAssignToAll(assignment.assignToAll ?? true);
      setAssignedStudentIds(assignment.assignedStudentIds || []);
      setError("");
    }
  }, [assignment]);

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

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dueDate) {
      setError("Please fill in all required fields (title, instructions, due date).");
      return;
    }

    if (!assignToAll && assignedStudentIds.length === 0) {
      setError("Please select at least one student or choose 'All Students'.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate,
          maxPoints: parseInt(maxPoints, 10) || 100,
          assignToAll,
          assignedStudentIds: assignToAll ? [] : assignedStudentIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update assignment");
      }

      onAssignmentUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Mobile Drag Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="sm:hidden flex justify-center pb-3 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Edit3 className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Edit Assignment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update specifications, deadlines, or audience</p>
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
          <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs sm:text-sm text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Assignment Title
            </label>
            <input
              type="text"
              placeholder="e.g. Lab 4: B+ Tree Index Optimization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Instructions & Problem Description
            </label>
            <textarea
              rows={4}
              placeholder="Detail the requirements, sample datasets, and grading rubric..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none min-h-[90px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Max Points
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxPoints}
                onChange={(e) => setMaxPoints(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-base sm:text-xs text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[44px]"
                required
              />
            </div>
          </div>

          {/* Target Audience / Student Selection */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assignment Allocation
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={assignToAll}
                  onChange={(e) => {
                    setAssignToAll(e.target.checked);
                    if (e.target.checked) {
                      setAssignedStudentIds([]);
                    }
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Assign to All Students</span>
              </label>
            </div>

            {!assignToAll && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Select individual students ({assignedStudentIds.length} selected):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignedStudentIds(students.map((s) => s.id))}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setAssignedStudentIds([])}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Filter students by name or email..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 divide-y divide-slate-100 dark:divide-slate-900">
                  {students.filter(
                    (s) =>
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.email.toLowerCase().includes(studentSearch.toLowerCase())
                  ).length === 0 ? (
                    <p className="text-center py-3 text-xs text-slate-400">No students match search filter.</p>
                  ) : (
                    students
                      .filter(
                        (s) =>
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((student) => {
                        const isSelected = assignedStudentIds.includes(student.id);
                        return (
                          <div
                            key={student.id}
                            onClick={() => {
                              if (isSelected) {
                                setAssignedStudentIds(assignedStudentIds.filter((id) => id !== student.id));
                              } else {
                                setAssignedStudentIds([...assignedStudentIds, student.id]);
                              }
                            }}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-medium"
                                : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 shrink-0">
                                {student.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <p className="truncate leading-tight">{student.name}</p>
                                <p className="text-[10px] text-slate-400 leading-tight truncate">{student.email}</p>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
                              ) : (
                                <Square className="h-4 w-4 text-slate-300 dark:text-slate-600" strokeWidth={1.75} />
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
