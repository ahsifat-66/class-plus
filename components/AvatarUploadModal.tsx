"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Trash2, Camera, Check, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  userName: string;
  onAvatarUpdated?: (newUrl: string | null) => void;
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatar,
  userName,
  onAvatarUpdated,
}: AvatarUploadModalProps) {
  const { refreshUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB. Please choose a smaller file.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please drop a valid JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload avatar");
      }

      setSuccess("Profile picture updated successfully!");
      if (data.user) {
        try {
          localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
        } catch (e) {}
      }

      await refreshUser();
      if (onAvatarUpdated) {
        onAvatarUpdated(data.avatarUrl);
      }

      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove avatar");
      }

      setSuccess("Profile picture removed.");
      if (data.user) {
        try {
          localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
        } catch (e) {}
      }

      await refreshUser();
      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }

      setTimeout(() => {
        handleClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to remove profile picture.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Profile Picture</h2>
              <p className="text-xs text-slate-500">Upload a custom image or photo</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center gap-2.5 text-xs text-emerald-700 animate-in fade-in">
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Avatar Preview Display */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative">
            {displayAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatar}
                alt={userName}
                className="h-28 w-28 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-md"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 text-white font-extrabold text-3xl shadow-md ring-4 ring-indigo-500/20">
                {getInitials(userName || "User")}
              </div>
            )}
            {previewUrl && (
              <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {previewUrl ? "Previewing new selection" : "Current profile avatar"}
          </span>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 p-5 text-center space-y-2 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm mx-auto text-slate-400 group-hover:text-indigo-600 transition-colors">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
              Click to browse
            </span>{" "}
            <span className="text-xs text-slate-500">or drag and drop</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports JPEG, PNG, or WebP (max 5 MB)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            {currentAvatar && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isUploading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span>Remove Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
