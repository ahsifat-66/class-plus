import { prisma } from "@/lib/prisma";

/**
 * Calculates the next sequential ClassPulse Unique ID (format: CP-1001, CP-1002, ...)
 */
export async function getNextUniqueId(client = prisma): Promise<string> {
  const usersWithId = await client.user.findMany({
    where: {
      uniqueId: {
        startsWith: "CP-",
      },
    },
    select: {
      uniqueId: true,
    },
  });

  let maxNum = 1000;
  for (const u of usersWithId) {
    if (u.uniqueId) {
      const match = u.uniqueId.match(/^CP-(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxNum) {
          maxNum = val;
        }
      }
    }
  }

  return `CP-${maxNum + 1}`;
}

/**
 * Ensures a user has a valid uniqueId. If missing, sequentially assigns the next available CP-xxxx and persists it.
 */
export async function ensureUserUniqueId(
  user: { id: string; email?: string | null; uniqueId?: string | null },
  client = prisma
): Promise<string> {
  // Permanent Super Admin always gets ADM-001
  if (user.email?.toLowerCase().trim() === "abidhasansifat66@gmail.com") {
    if (user.uniqueId !== "ADM-001") {
      try {
        await client.user.update({
          where: { id: user.id },
          data: { uniqueId: "ADM-001" },
        });
      } catch (err: any) {
        // Continue even if DB write fails/offline
      }
    }
    return "ADM-001";
  }

  if (user.uniqueId && user.uniqueId.trim()) {
    return user.uniqueId;
  }

  // Attempt up to 5 times to assign the next sequential ID safely
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const nextId = await getNextUniqueId(client);
      const updated = await client.user.update({
        where: { id: user.id },
        data: { uniqueId: nextId },
        select: { uniqueId: true },
      });

      if (updated.uniqueId) {
        return updated.uniqueId;
      }
    } catch (err: any) {
      console.warn(`UniqueId assignment collision (attempt ${attempt + 1}), retrying...`, err?.message);
    }
  }

  // Fallback timestamp-based identifier in extreme concurrency situations
  const fallback = `CP-${Date.now().toString().slice(-4)}`;
  await client.user.update({
    where: { id: user.id },
    data: { uniqueId: fallback },
  });
  return fallback;
}

/**
 * Auto-backfill all existing users in the database missing a uniqueId.
 */
export async function backfillAllUsers(client = prisma): Promise<number> {
  const usersWithoutId = await client.user.findMany({
    where: {
      OR: [
        { uniqueId: null },
        { uniqueId: "" },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, uniqueId: true },
  });

  let backfilledCount = 0;
  for (const u of usersWithoutId) {
    await ensureUserUniqueId(u, client);
    backfilledCount++;
  }

  return backfilledCount;
}
