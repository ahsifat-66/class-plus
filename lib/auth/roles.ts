import fs from "fs";
import path from "path";

export type AppRole = "student" | "teacher" | "moderator" | "super_admin";

export const PERMANENT_SUPER_ADMIN_EMAIL = "abidhasansifat66@gmail.com";
export const PERMANENT_SUPER_ADMIN_ID = "ADM-001";

// Path to persistent assigned roles file
const ROLES_STORE_FILE = path.join(process.cwd(), "data", "assignedRoles.json");

interface RoleStoreData {
  [email: string]: {
    role: AppRole;
    updatedAt: string;
  };
}

function readRoleStore(): RoleStoreData {
  try {
    if (fs.existsSync(ROLES_STORE_FILE)) {
      const content = fs.readFileSync(ROLES_STORE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading roles store:", err);
  }
  return {};
}

function writeRoleStore(data: RoleStoreData): boolean {
  try {
    const dir = path.dirname(ROLES_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ROLES_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing roles store:", err);
    return false;
  }
}

/**
 * Resolves the effective role of a user given their profile.
 * - Permanent super admin always resolves to 'super_admin'.
 * - Custom assigned roles (e.g. moderator) take precedence.
 * - Defaults to existing role (normalized to lowercase) or 'student'.
 */
export function resolveUserRole(user?: { email?: string | null; role?: string | null } | null): AppRole {
  if (!user || !user.email) return "student";

  const email = user.email.toLowerCase().trim();
  if (email === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return "super_admin";
  }

  // Check store
  const store = readRoleStore();
  if (store[email] && store[email].role) {
    return store[email].role;
  }

  const rawRole = (user.role || "").toLowerCase().trim();
  if (rawRole === "super_admin" || rawRole === "moderator" || rawRole === "teacher") {
    return rawRole as AppRole;
  }
  if (rawRole === "student") {
    return "student";
  }

  return "student";
}

/**
 * Assigns a role to a user.
 * Cannot change, demote, or overwrite the permanent super admin.
 */
export function assignUserRole(targetEmail: string, newRole: AppRole): { success: boolean; message?: string } {
  const email = targetEmail.toLowerCase().trim();
  if (email === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: "The permanent Super Admin role cannot be modified, demoted, or deleted by anyone.",
    };
  }

  if (!["student", "teacher", "moderator"].includes(newRole)) {
    return {
      success: false,
      message: "Invalid role specified. Supported roles are student, teacher, or moderator.",
    };
  }

  const store = readRoleStore();
  store[email] = {
    role: newRole,
    updatedAt: new Date().toISOString(),
  };

  const saved = writeRoleStore(store);
  return {
    success: saved,
    message: saved ? "Role updated successfully." : "Failed to persist role update.",
  };
}

/**
 * Removes a user's role override from the persistent store upon deletion.
 */
export function removeUserRole(targetEmail: string): boolean {
  const email = targetEmail.toLowerCase().trim();
  if (email === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    return false;
  }
  const store = readRoleStore();
  if (store[email]) {
    delete store[email];
    return writeRoleStore(store);
  }
  return true;
}

/**
 * Access check helper functions
 */
export function checkIsSuperAdmin(user?: { email?: string | null; role?: string | null } | null): boolean {
  if (!user) return false;
  const emailMatch = user.email?.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase();
  const roleMatch = user.role?.toLowerCase().trim() === "super_admin";
  return Boolean(emailMatch || roleMatch);
}

export function checkIsModerator(user?: { role?: string | null } | null): boolean {
  if (!user) return false;
  return user.role?.toLowerCase().trim() === "moderator";
}

export function checkHasAdminAccess(user?: { email?: string | null; role?: string | null } | null): boolean {
  return checkIsSuperAdmin(user) || checkIsModerator(user);
}
