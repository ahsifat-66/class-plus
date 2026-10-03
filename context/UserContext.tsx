"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole =
  | "student"
  | "teacher"
  | "moderator"
  | "super_admin"
  | "STUDENT"
  | "TEACHER"
  | "MODERATOR"
  | "SUPER_ADMIN"
  | string;

export interface User {
  id: string;
  uniqueId?: string | null;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  avatarUrl?: string | null;
  institution?: string | null;
  grade?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export interface UserSummary {
  teachingCount: number;
  enrolledCount: number;
  assignmentsPosted: number;
  assignmentsSubmitted: number;
  totalStudents: number;
  activeRole: string;
}

interface UserContextType {
  currentUser: User | null;
  userSummary: UserSummary | null;
  allUsers: User[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  hasAdminAccess: boolean;
  switchUser: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setUserSummary(data.summary || null);
        if (data.user) {
          try {
            localStorage.setItem("classpulse_user_cache", JSON.stringify(data.user));
          } catch (err) {}
        } else {
          try {
            localStorage.removeItem("classpulse_user_cache");
          } catch (err) {}
        }
      }
    } catch (e) {
      console.error("Failed to fetch active user", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = async (_email: string) => {
    // Unauthenticated user switching disabled for security
    console.warn("Direct user switching is disabled for security hardening.");
  };

  const normalizeUser = (user: User | null): User | null => {
    if (!user) return null;
    if (user.email?.toLowerCase().trim() === "abidhasansifat66@gmail.com") {
      return {
        ...user,
        role: "super_admin",
        uniqueId: "ADM-001",
      };
    }
    return user;
  };

  const isSuperAdmin = Boolean(
    currentUser?.email?.toLowerCase().trim() === "abidhasansifat66@gmail.com" ||
    currentUser?.role?.toLowerCase().trim() === "super_admin"
  );
  const isModerator = Boolean(currentUser?.role?.toLowerCase().trim() === "moderator");
  const hasAdminAccess = Boolean(isSuperAdmin || isModerator);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("classpulse_user_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.id) {
          setCurrentUser(normalizeUser(parsed));
          setIsLoading(false);
        }
      }
    } catch (err) {}
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser: normalizeUser(currentUser),
        userSummary,
        allUsers,
        isLoading,
        isSuperAdmin,
        isModerator,
        hasAdminAccess,
        switchUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
