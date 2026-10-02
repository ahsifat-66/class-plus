import fs from "fs";
import path from "path";

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

function readFeedbacks(): UserFeedback[] {
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

function writeFeedbacks(feedbacks: UserFeedback[]): boolean {
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
 * Returns all feedbacks sorted by newest first
 */
export function getAllFeedbacks(): UserFeedback[] {
  const list = readFeedbacks();
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Saves a new user feedback
 */
export function createFeedback(
  data: Omit<UserFeedback, "id" | "status" | "createdAt">
): UserFeedback {
  const feedbacks = readFeedbacks();
  const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newEntry: UserFeedback = {
    id,
    userId: data.userId || "anonymous",
    userName: data.userName || "Anonymous",
    userEmail: data.userEmail || "",
    uniqueId: data.uniqueId || "N/A",
    userRole: data.userRole || "student",
    category: data.category || "general",
    message: data.message.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  feedbacks.unshift(newEntry);
  writeFeedbacks(feedbacks);
  return newEntry;
}

/**
 * Updates the status of a feedback (new | reviewed)
 */
export function updateFeedbackStatus(
  id: string,
  status: "new" | "reviewed"
): UserFeedback | null {
  const feedbacks = readFeedbacks();
  const index = feedbacks.findIndex((f) => f.id === id);
  if (index === -1) return null;

  feedbacks[index].status = status;
  writeFeedbacks(feedbacks);
  return feedbacks[index];
}

/**
 * Deletes a feedback by ID
 */
export function deleteFeedback(id: string): boolean {
  const feedbacks = readFeedbacks();
  const filtered = feedbacks.filter((f) => f.id !== id);
  if (filtered.length === feedbacks.length) return false;

  return writeFeedbacks(filtered);
}

/**
 * Computes feedback telemetry metrics
 */
export function getFeedbackStats() {
  const list = readFeedbacks();
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
