/**
 * Authentication interfaces and core user models.
 * Hardcoded mock/dummy user datasets have been deprecated and removed.
 * User management is strictly database-driven.
 */

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT" | "MODERATOR" | "SUPER_ADMIN" | string;
  avatar?: string | null;
  institution?: string | null;
  grade?: string | null;
}

