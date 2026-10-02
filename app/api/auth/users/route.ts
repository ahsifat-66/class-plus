import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { ensureUserUniqueId } from "@/lib/utils/uniqueId";
import {
  resolveUserRole,
  PERMANENT_SUPER_ADMIN_EMAIL,
  PERMANENT_SUPER_ADMIN_ID,
} from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Ensure all users have uniqueId and resolved administrative roles
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        let uniqueId = u.uniqueId;
        if (!uniqueId) {
          uniqueId = await ensureUserUniqueId(u);
        }

        const isSuperAdminEmail =
          u.email?.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase();

        return {
          ...u,
          role: resolveUserRole(u),
          uniqueId: isSuperAdminEmail ? PERMANENT_SUPER_ADMIN_ID : uniqueId,
        };
      })
    );

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
