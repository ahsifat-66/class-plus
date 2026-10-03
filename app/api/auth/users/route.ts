import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { ensureUserUniqueId } from "@/lib/utils/uniqueId";
import {
  resolveUserRole,
  checkIsSuperAdmin,
  PERMANENT_SUPER_ADMIN_EMAIL,
  PERMANENT_SUPER_ADMIN_ID,
} from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.email || !session?.id) {
      return NextResponse.json(
        { error: "Access denied. Authentication required." },
        { status: 401 }
      );
    }

    const caller = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!caller) {
      return NextResponse.json(
        { error: "Access denied. User not found." },
        { status: 403 }
      );
    }

    const callerRole = resolveUserRole(caller);
    if (!checkIsSuperAdmin({ ...caller, role: callerRole })) {
      return NextResponse.json(
        { error: "Access denied. Super Administrator privileges required." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        uniqueId: true,
        avatar: true,
        avatarUrl: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
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
