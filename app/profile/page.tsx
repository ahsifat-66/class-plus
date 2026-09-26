"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import CreateClassModal from "@/components/CreateClassModal";
import JoinClassModal from "@/components/JoinClassModal";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import {
  User as UserIcon,
  Mail,
  School,
  GraduationCap,
  BookOpen,
  FileCheck,
  Users,
  Award,
  Edit3,
  Save,
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";

interface ProfileStats {
  teachingCount: number;
  enrolledCount: number;
  assignmentsPosted: number;
  assignmentsSubmitted: number;
  totalStudents: number;
  activeRole: string;
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  avatarUrl?: string | null;
  institution: string | null;
  grade: string | null;
  bio: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, userSummary, refreshUser } = useUser();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    grade: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Modals for navbar actions
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Synchronize profile immediately if currentUser is loaded in context
  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => prev || (currentUser as ProfileUser));
      setFormData((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        institution: currentUser.institution || prev.institution,
        grade: currentUser.grade || prev.grade,
        bio: currentUser.bio || prev.bio,
      }));
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchProfile = useCallback(async () => {
    try {
      const emailQuery = currentUser?.email
        ? `?email=${encodeURIComponent(currentUser.email)}`
        : "";
      const res = await fetch(`/api/profile${emailQuery}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setStats(data.stats);

        setFormData({
          name: data.user.name || "",
          institution: data.user.institution || "",
          grade: data.user.grade || "",
          bio: data.user.bio || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else if (res.status === 401 && !currentUser) {
        window.location.href = "/login?callbackUrl=/profile";
      }
    } catch (err: any) {
      console.error("Profile load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name.trim()) {
      setErrorMessage("Full name cannot be empty.");
      return;
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setErrorMessage("Please enter your current password to set a new password.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage("New passwords do not match.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrorMessage("New password must be at least 6 characters.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        institution: formData.institution.trim() || null,
        grade: formData.grade.trim() || null,
        bio: formData.bio.trim() || null,
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to update profile.");
        return;
      }

      setProfile(data.user);
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setShowPasswordSection(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Update local storage cache and global user context
      try {
        localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
      } catch (err) {}

      await refreshUser();
    } catch (err: any) {
      console.error("Save profile error:", err);
      setErrorMessage("An unexpected error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "CP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const dynamicBadge =
    stats?.activeRole ||
    userSummary?.activeRole ||
    (currentUser?.role === "TEACHER" ? "Teacher" : "Student");

  const effectiveProfile = profile || (currentUser as ProfileUser | null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        onCreateClassOpen={() => setIsCreateOpen(true)}
        onJoinClassOpen={() => setIsJoinOpen(true)}
      />

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400">
            Account & Academic Profile
          </span>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-900 shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-900 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{successMessage}</span>
          </div>
        )}

        {isLoading && !effectiveProfile ? (
          <div className="space-y-6">
            <div className="h-44 rounded-3xl bg-white border border-slate-200 p-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 rounded-3xl bg-white border border-slate-200 p-6 animate-pulse" />
              <div className="h-48 rounded-3xl bg-white border border-slate-200 p-6 animate-pulse" />
            </div>
          </div>
        ) : effectiveProfile ? (
          <>
            {/* Header / Avatar Hero Card */}
            <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {/* Avatar or Initials */}
                  <div className="relative shrink-0">
                    {(effectiveProfile.avatarUrl || effectiveProfile.avatar) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={effectiveProfile.avatarUrl || effectiveProfile.avatar || ""}
                        alt={effectiveProfile.name}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                      />
                    ) : (
                      <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 text-white font-extrabold text-2xl sm:text-3xl shadow-lg ring-4 ring-white/20">
                        {getInitials(effectiveProfile.name)}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-900 ${
                        dynamicBadge.includes("Teacher") ? "bg-purple-400" : "bg-emerald-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-2 ring-slate-200 hover:bg-slate-100 hover:text-indigo-600 transition-transform active:scale-95"
                      title="Upload or change profile picture"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* User Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {effectiveProfile.name}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white border border-white/20 backdrop-blur-sm transition-all"
                      >
                        <Camera className="h-3 w-3" />
                        <span>Upload Photo</span>
                      </button>
                      <span
                        className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full backdrop-blur-md border ${
                          dynamicBadge.includes("Teacher") && dynamicBadge.includes("Student")
                            ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                            : dynamicBadge.includes("Teacher")
                            ? "bg-purple-500/30 text-purple-200 border-purple-400/40"
                            : "bg-emerald-500/30 text-emerald-200 border-emerald-400/40"
                        }`}
                      >
                        {dynamicBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{effectiveProfile.email}</span>
                    </div>

                    {effectiveProfile.createdAt && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        <span>
                          Member since{" "}
                          {new Date(effectiveProfile.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Profile Toggle Button */}
                <div className="shrink-0 sm:self-center">
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 ${
                      isEditing
                        ? "bg-white/20 text-white hover:bg-white/30 border border-white/20"
                        : "bg-white text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4" />
                        <span>Cancel Editing</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 text-indigo-600" />
                        <span>Edit Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Edit Form Mode */}
            {isEditing ? (
              <form
                onSubmit={handleSave}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Update Profile Details</h2>
                    <p className="text-xs text-slate-500">
                      Manage your personal identity, academic background, and security settings.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    Editing Mode
                  </span>
                </div>

                {/* Primary Personal & Academic Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Display Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Institution / School Name
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      placeholder="e.g. Springfield Academy or Harvard University"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Grade / Standard
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="e.g. Class 6, Class 9 A, or Undergraduate"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={effectiveProfile.email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Bio / About */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bio / Subjects of Interest
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell your students and peers about your teaching subjects, study topics, or academic goals..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>

                {/* Password Change Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span>{showPasswordSection ? "Cancel Password Change" : "Change Account Password"}</span>
                  </button>

                  {showPasswordSection && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-4 animate-in fade-in">
                      <div className="text-xs text-slate-500">
                        Leave blank if you do not wish to change your password. Must be at least 6 characters.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Current Password */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, currentPassword: e.target.value })
                              }
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 pr-8 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                              {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPass ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={(e) =>
                                setFormData({ ...formData, newPassword: e.target.value })
                              }
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 pr-8 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                              {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({ ...formData, confirmPassword: e.target.value })
                            }
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setShowPasswordSection(false);
                    }}
                    disabled={isSaving}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode: Academic Details Card */
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <School className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-bold text-slate-900">Academic Details</h2>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Institution / School
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {effectiveProfile.institution || (
                        <span className="text-slate-400 italic font-normal">
                          Not specified yet
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Grade / Standard
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {effectiveProfile.grade || (
                        <span className="text-slate-400 italic font-normal">
                          Not specified yet
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/70 p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Subjects & Academic Bio
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {effectiveProfile.bio || (
                      <span className="text-slate-400 italic">
                        No bio or subjects provided yet. Click "Edit Profile" to add details about your academic interests.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Activity Stats Cards: Teacher & Student Sections */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Activity Overview</h2>
                <span className="text-xs text-slate-500">Live multi-role statistics</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. As Teacher Card */}
                <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-white p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Instructor Activity
                          </h3>
                          <span className="text-[11px] text-purple-700 font-medium">
                            Teaching & Course Management
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/dashboard?view=teaching"
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
                      >
                        <span>Open Teaching View</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="rounded-2xl bg-white border border-purple-100 p-3.5 shadow-sm text-center">
                        <BookOpen className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {stats?.teachingCount ?? 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Classrooms
                        </span>
                      </div>

                      <div className="rounded-2xl bg-white border border-purple-100 p-3.5 shadow-sm text-center">
                        <FileCheck className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {stats?.assignmentsPosted ?? 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Assignments
                        </span>
                      </div>

                      <div className="rounded-2xl bg-white border border-purple-100 p-3.5 shadow-sm text-center">
                        <Users className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {stats?.totalStudents ?? 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Total Students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Ready to launch another course?
                    </span>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-100/70 hover:bg-purple-200 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <span>+ Create Classroom</span>
                    </button>
                  </div>
                </div>

                {/* 2. As Student Card */}
                <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Student Activity
                          </h3>
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Enrolled Courses & Submissions
                          </span>
                        </div>
                      </div>
                      <Link
                        href="/dashboard?view=enrolled"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        <span>Open Student View</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-2xl bg-white border border-emerald-100 p-3.5 shadow-sm text-center">
                        <BookOpen className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {stats?.enrolledCount ?? 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Enrolled Classes
                        </span>
                      </div>

                      <div className="rounded-2xl bg-white border border-emerald-100 p-3.5 shadow-sm text-center">
                        <Award className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                        <span className="text-xl font-extrabold text-slate-900 block">
                          {stats?.assignmentsSubmitted ?? 0}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Submitted Tasks
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Have a code from another teacher?
                    </span>
                    <button
                      onClick={() => setIsJoinOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <span>+ Join Classroom</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-4">
            <UserIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">User Session Not Detected</h3>
            <p className="text-xs text-slate-500">
              Please sign in to view and manage your profile and classrooms.
            </p>
            <div>
              <Link
                href="/login?callbackUrl=/profile"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all"
              >
                <span>Sign In to ClassPulse</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Modals for Create and Join Class */}
      <CreateClassModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onClassCreated={fetchProfile}
      />

      <JoinClassModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onClassJoined={fetchProfile}
      />

      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={effectiveProfile?.avatar || null}
        userName={effectiveProfile?.name || ""}
        onAvatarUpdated={(newUrl) => {
          if (profile) {
            setProfile({ ...profile, avatar: newUrl });
          }
          fetchProfile();
        }}
      />
    </div>
  );
}
