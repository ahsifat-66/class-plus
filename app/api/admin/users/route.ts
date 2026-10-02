import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import {
  resolveUserRole,
  assignUserRole,
  checkIsSuperAdmin,
  checkIsModerator,
  checkHasAdminAccess,
  PERMANENT_SUPER_ADMIN_EMAIL,
  PERMANENT_SUPER_ADMIN_ID,
  AppRole,
} from "@/lib/auth/roles";
import { ensureUserUniqueId } from "@/lib/utils/uniqueId";

export const dynamic = "force-dynamic";

/**
 * Helper to get the calling user's DB entity and resolved role
 */
async function getCaller(req: NextRequest) {
  const session = await getSessionUser(req);
  let callerEmail = session?.email;

  if (!callerEmail) {
    callerEmail = req.cookies.get("classpulse_user_email")?.value;
  }

  if (!callerEmail) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: callerEmail },
    select: { id: true, email: true, name: true, role: true, uniqueId: true },
  });

  if (!dbUser) return null;

  const role = resolveUserRole(dbUser);
  return {
    ...dbUser,
    role,
  };
}

export async function GET(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller || !checkHasAdminAccess(caller)) {
      return NextResponse.json(
        { error: "Access denied. Administrator privileges required." },
        { status: 403 }
      );
    }

    const [rawUsers, totalClassrooms] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          uniqueId: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          avatarUrl: true,
          institution: true,
          grade: true,
          createdAt: true,
          _count: {
            select: {
              createdCourses: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.classroom.count(),
    ]);

    let superAdminCount = 0;
    let moderatorCount = 0;
    let teacherCount = 0;
    let studentCount = 0;

    const users = await Promise.all(
      rawUsers.map(async (u) => {
        let uniqueId = u.uniqueId;
        if (!uniqueId) {
          uniqueId = await ensureUserUniqueId(u);
        }

        const isSuperAdminEmail =
          u.email?.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase();
        const role = resolveUserRole(u);

        if (role === "super_admin") superAdminCount++;
        else if (role === "moderator") moderatorCount++;
        else if (role === "teacher") teacherCount++;
        else studentCount++;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role,
          uniqueId: isSuperAdminEmail ? PERMANENT_SUPER_ADMIN_ID : uniqueId,
          avatar: u.avatar || u.avatarUrl,
          institution: u.institution,
          grade: u.grade,
          createdAt: u.createdAt,
          teachingCount: u._count.createdCourses,
          enrolledCount: u._count.enrollments,
          isPermanentSuperAdmin: isSuperAdminEmail,
        };
      })
    );

    const stats = {
      totalUsers: users.length,
      superAdminCount,
      moderatorCount,
      teacherCount,
      studentCount,
      totalClassrooms,
    };

    return NextResponse.json({
      users,
      stats,
      callerRole: caller.role,
      isCallerSuperAdmin: checkIsSuperAdmin(caller),
      isCallerModerator: checkIsModerator(caller),
    });
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller || !checkIsSuperAdmin(caller)) {
      return NextResponse.json(
        { error: "Permission denied. Only Super Admin can modify user roles." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, newRole } = body;

    if (!email || !newRole) {
      return NextResponse.json(
        { error: "Target email and newRole are required." },
        { status: 400 }
      );
    }

    // Permanent Super Admin protection
    if (email.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Permanent Super Admin role cannot be modified, demoted, or deleted." },
        { status: 403 }
      );
    }

    const validRoles: AppRole[] = ["student", "teacher", "moderator"];
    if (!validRoles.includes(newRole as AppRole)) {
      return NextResponse.json(
        { error: `Invalid role '${newRole}'. Allowed roles: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const result = assignUserRole(email, newRole as AppRole);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} role successfully changed to ${newRole}.`,
      email,
      newRole,
    });
  } catch (error: any) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
