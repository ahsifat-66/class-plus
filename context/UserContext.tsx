"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  avatar: string | null;
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
      const res = await fetch("/api/auth/users");
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
      setIsLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setUserSummary(data.summary || null);
      }
    } catch (e) {
      console.error("Failed to fetch active user", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        // Refresh page data so server/client components reload the active perspective
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to switch user", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        userSummary,
        allUsers,
        isLoading,
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
