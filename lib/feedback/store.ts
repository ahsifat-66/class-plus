import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  uniqueId: string;
  userRole: string;
  category: "suggestion" | "bug" | "general";
  message: string;
  status: "new" | "reviewed";
  createdAt: string;
}

const FEEDBACKS_FILE = path.join(process.cwd(), "data", "feedbacks.json");

function readFeedbacksFromFile(): UserFeedback[] {
  try {
    if (fs.existsSync(FEEDBACKS_FILE)) {
      const content = fs.readFileSync(FEEDBACKS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading feedbacks file:", err);
  }
  return [];
}

function writeFeedbacksToFile(feedbacks: UserFeedback[]): boolean {
  try {
    const dir = path.dirname(FEEDBACKS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FEEDBACKS_FILE, JSON.stringify(feedbacks, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing feedbacks file:", err);
    return false;
  }
}

/**
 * Returns all feedbacks sorted by newest first directly from Database
 */
export async function getAllFeedbacks(): Promise<UserFeedback[]> {
  try {
    const rows = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (rows && rows.length > 0) {
      const mapped: UserFeedback[] = rows.map((r) => ({
        id: r.id,
        userId: r.userId || "guest",
        userName: r.userName || "Anonymous User",
        userEmail: r.userEmail || "N/A",
        uniqueId: r.uniqueId || "N/A",
        userRole: r.userRole || "student",
        category: (r.category as any) || "general",
        message: r.message,
        status: (r.status as any) || "new",
        createdAt: r.createdAt.toISOString(),
      }));
      // Keep file cache in sync
      writeFeedbacksToFile(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Prisma error in getAllFeedbacks, falling back to file:", err);
  }

  // Fallback to file storage if database query returns empty or errors
  const list = readFeedbacksFromFile();
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Saves a new user feedback directly to Database
 */
export async function createFeedback(
  data: Omit<UserFeedback, "id" | "status" | "createdAt">
): Promise<UserFeedback> {
  const payload = {
    userId: data.userId || "guest",
    userName: data.userName || "Anonymous User",
    userEmail: data.userEmail || "N/A",
    uniqueId: data.uniqueId || "N/A",
    userRole: data.userRole || "student",
    category: data.category || "general",
    message: data.message.trim(),
    status: "new",
  };

  try {
    const created = await prisma.feedback.create({
      data: payload,
    });

    const entry: UserFeedback = {
      id: created.id,
      userId: created.userId || payload.userId,
      userName: created.userName || payload.userName,
      userEmail: created.userEmail || payload.userEmail,
      uniqueId: created.uniqueId || payload.uniqueId,
      userRole: created.userRole || payload.userRole,
      category: (created.category as any) || payload.category,
      message: created.message,
      status: (created.status as any) || "new",
      createdAt: created.createdAt.toISOString(),
    };

    // Update file cache
    const fileList = readFeedbacksFromFile();
    fileList.unshift(entry);
    writeFeedbacksToFile(fileList);

    return entry;
  } catch (err) {
    console.error("Prisma error in createFeedback, falling back to file:", err);
    const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry: UserFeedback = {
      id,
      ...payload,
      category: payload.category as any,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    const fileList = readFeedbacksFromFile();
    fileList.unshift(entry);
    writeFeedbacksToFile(fileList);
    return entry;
  }
}

/**
 * Updates status of feedback directly in Database
 */
export async function updateFeedbackStatus(
  id: string,
  status: "new" | "reviewed"
): Promise<UserFeedback | null> {
  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
    });

    const entry: UserFeedback = {
      id: updated.id,
      userId: updated.userId || "guest",
      userName: updated.userName || "Anonymous User",
      userEmail: updated.userEmail || "N/A",
      uniqueId: updated.uniqueId || "N/A",
      userRole: updated.userRole || "student",
      category: (updated.category as any) || "general",
      message: updated.message,
      status: (updated.status as any) || status,
      createdAt: updated.createdAt.toISOString(),
    };

    // Sync file cache
    const fileList = readFeedbacksFromFile();
    const idx = fileList.findIndex((f) => f.id === id);
    if (idx !== -1) {
      fileList[idx].status = status;
      writeFeedbacksToFile(fileList);
    }

    return entry;
  } catch (err) {
    console.error("Prisma error in updateFeedbackStatus, fallback to file:", err);
    const fileList = readFeedbacksFromFile();
    const idx = fileList.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    fileList[idx].status = status;
    writeFeedbacksToFile(fileList);
    return fileList[idx];
  }
}

/**
 * Deletes a feedback by ID directly from Database
 */
export async function deleteFeedback(id: string): Promise<boolean> {
  let dbSuccess = false;
  try {
    await prisma.feedback.delete({
      where: { id },
    });
    dbSuccess = true;
  } catch (err) {
    console.error("Prisma error in deleteFeedback:", err);
  }

  // Also remove from file cache
  const fileList = readFeedbacksFromFile();
  const filtered = fileList.filter((f) => f.id !== id);
  if (filtered.length !== fileList.length) {
    writeFeedbacksToFile(filtered);
    return true;
  }

  return dbSuccess;
}

/**
 * Deletes all feedbacks submitted by a given user
 */
export async function deleteFeedbacksByUser(userId: string, email?: string): Promise<number> {
  let count = 0;
  try {
    const orConditions: any[] = [{ userId }];
    if (email) {
      orConditions.push({ userEmail: { equals: email, mode: "insensitive" } });
    }
    const res = await prisma.feedback.deleteMany({
      where: { OR: orConditions },
    });
    count = res.count;
  } catch (err) {
    console.error("Prisma error in deleteFeedbacksByUser:", err);
  }

  // Also sync file cache
  const fileList = readFeedbacksFromFile();
  const normalizedEmail = email?.toLowerCase().trim();
  const filtered = fileList.filter(
    (f) => f.userId !== userId && (!normalizedEmail || f.userEmail.toLowerCase().trim() !== normalizedEmail)
  );
  if (filtered.length !== fileList.length) {
    writeFeedbacksToFile(filtered);
    count = Math.max(count, fileList.length - filtered.length);
  }

  return count;
}

/**
 * Computes feedback telemetry metrics directly from Database
 */
export async function getFeedbackStats() {
  try {
    const [total, newCount, reviewedCount, bugCount, suggestionCount, generalCount] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: "new" } }),
      prisma.feedback.count({ where: { status: "reviewed" } }),
      prisma.feedback.count({ where: { category: "bug" } }),
      prisma.feedback.count({ where: { category: "suggestion" } }),
      prisma.feedback.count({ where: { category: "general" } }),
    ]);

    return {
      total,
      newCount,
      reviewedCount,
      bugCount,
      suggestionCount,
      generalCount,
    };
  } catch (err) {
    console.error("Prisma error in getFeedbackStats, fallback to file:", err);
    const list = readFeedbacksFromFile();
    let newCount = 0;
    let reviewedCount = 0;
    let bugCount = 0;
    let suggestionCount = 0;
    let generalCount = 0;

    for (const f of list) {
      if (f.status === "new") newCount++;
      else if (f.status === "reviewed") reviewedCount++;

      if (f.category === "bug") bugCount++;
      else if (f.category === "suggestion") suggestionCount++;
      else generalCount++;
    }

    return {
      total: list.length,
      newCount,
      reviewedCount,
      bugCount,
      suggestionCount,
      generalCount,
    };
  }
}
