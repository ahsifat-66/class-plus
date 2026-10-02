import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { ensureUserUniqueId } from "@/lib/utils/uniqueId";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Ensure all users have uniqueId
    for (const u of users) {
      if (!u.uniqueId) {
        u.uniqueId = await ensureUserUniqueId(u);
      }
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
