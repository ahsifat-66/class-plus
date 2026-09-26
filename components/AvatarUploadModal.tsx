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

  // Client-side image compression: resizes to max 256x256 px JPEG Base64 Data URL
  const compressImage = (file: File, maxDim = 256, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to process image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image exceeds 10MB limit. Please choose a smaller photo.");
      return;
    }

    try {
      setSelectedFile(file);
      // Immediately compress to max 256x256 for instant preview and lightweight payload
      const compressed = await compressImage(file, 256);
      setPreviewUrl(compressed);
    } catch (err) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file.");
      return;
    }

    try {
      setSelectedFile(file);
      const compressed = await compressImage(file, 256);
      setPreviewUrl(compressed);
    } catch (err) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !previewUrl) return;

    try {
      setIsUploading(true);
      setError(null);

      // Post 256x256 Base64 Data URL to /api/user/avatar
      let res: Response;
      if (previewUrl && previewUrl.startsWith("data:image/")) {
        res = await fetch("/api/user/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: previewUrl }),
        });
      } else {
        const formData = new FormData();
        if (selectedFile) {
          formData.append("avatar", selectedFile);
        }
        res = await fetch("/api/user/avatar", {
          method: "POST",
          body: formData,
        });
      }

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
        onAvatarUpdated(data.avatarUrl || previewUrl);
      }

      setTimeout(() => {
        handleClose();
      }, 600);
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

      const res = await fetch("/api/user/avatar", {
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
      }, 600);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[92vh] flex flex-col rounded-t-[28px] sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Camera strokeWidth={1.75} size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Manage Profile Picture</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Upload a custom image or photo</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X strokeWidth={1.75} size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 sm:p-3.5 flex items-start gap-2 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 sm:p-3.5 flex items-start gap-2 text-xs text-emerald-700 animate-in fade-in">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar Preview Display */}
          <div className="flex flex-col items-center justify-center space-y-2 py-1">
            <div className="relative">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={userName}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-teal-400 text-white font-extrabold text-2xl sm:text-3xl shadow-md ring-4 ring-indigo-500/20">
                  {getInitials(userName || "User")}
                </div>
              )}
              {previewUrl && (
                <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow ring-2 ring-white">
                  <Check strokeWidth={2.5} size={12} />
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              {previewUrl ? "Previewing selection (auto-optimized)" : "Current profile avatar"}
            </span>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 p-4 sm:p-5 text-center space-y-1.5 transition-all group active:scale-[0.99]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white shadow-sm mx-auto text-slate-400 group-hover:text-indigo-600 transition-colors">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">
                Tap to browse
              </span>{" "}
              <span className="text-xs text-slate-500">or take photo</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                JPEG, PNG, WebP, or Camera Photo
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-4 sm:p-6 pt-3 sm:pt-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            {currentAvatar && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isUploading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50 py-2 transition-colors"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Remove Photo</span>
                <span className="sm:hidden">Remove</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[38px] transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleUpload}
              disabled={(!selectedFile && !previewUrl) || isUploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 sm:px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 min-h-[38px] transition-all active:scale-95 disabled:opacity-40"
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
