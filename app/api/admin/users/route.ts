import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import {
  resolveUserRole,
  assignUserRole,
  removeUserRole,
  checkIsSuperAdmin,
  checkIsModerator,
  checkHasAdminAccess,
  PERMANENT_SUPER_ADMIN_EMAIL,
  PERMANENT_SUPER_ADMIN_ID,
  AppRole,
} from "@/lib/auth/roles";
import { deleteFeedbacksByUser } from "@/lib/feedback/store";
import { ensureUserUniqueId } from "@/lib/utils/uniqueId";

export const dynamic = "force-dynamic";

/**
 * Helper to get the calling user's DB entity and resolved role
 */
async function getCaller(req: NextRequest) {
  const session = await getSessionUser(req);
  const callerEmail = session?.email;

  if (!callerEmail || !session?.id) {
    return null;
  }

  if (callerEmail.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: callerEmail },
        select: { id: true, email: true, name: true, role: true, uniqueId: true },
      });
      if (dbUser) {
        return {
          ...dbUser,
          role: "super_admin" as AppRole,
          uniqueId: PERMANENT_SUPER_ADMIN_ID,
        };
      }
    } catch (_) {}

    return {
      id: "root-super-admin",
      email: PERMANENT_SUPER_ADMIN_EMAIL,
      name: "Abid Hasan (Super Admin)",
      role: "super_admin" as AppRole,
      uniqueId: PERMANENT_SUPER_ADMIN_ID,
    };
  }

  try {
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
  } catch (_) {
    return null;
  }
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

    const [rawUsers, totalClassrooms, rawClassrooms] = await Promise.all([
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
      prisma.classroom.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          subject: true,
          code: true,
          gradeLevel: true,
          createdAt: true,
          teacher: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
              announcements: true,
            },
          },
        },
      }),
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

    const classrooms = rawClassrooms.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      code: c.code,
      gradeLevel: c.gradeLevel,
      createdAt: c.createdAt,
      teacherName: c.teacher?.name || "Unknown Teacher",
      teacherEmail: c.teacher?.email || "",
      studentCount: c._count?.enrollments || 0,
      assignmentCount: c._count?.assignments || 0,
      announcementCount: c._count?.announcements || 0,
    }));

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
      classrooms,
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

export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller || !checkIsSuperAdmin(caller)) {
      return NextResponse.json(
        { error: "Permission denied. Only Super Admin can delete users." },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    let targetId = url.searchParams.get("id");
    let targetEmail = url.searchParams.get("email");

    if (!targetId && !targetEmail) {
      try {
        const body = await req.json();
        targetId = body.id;
        targetEmail = body.email;
      } catch (_) {}
    }

    if (!targetId && !targetEmail) {
      return NextResponse.json(
        { error: "Target user ID or email is required." },
        { status: 400 }
      );
    }

    // Immediate permanent Super Admin check
    if (
      targetEmail?.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase() ||
      targetId === PERMANENT_SUPER_ADMIN_ID
    ) {
      return NextResponse.json(
        { error: "Permanent Super Admin cannot be deleted." },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: targetId ? { id: targetId } : { email: targetEmail! },
      select: { id: true, email: true, name: true, uniqueId: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found in database." },
        { status: 404 }
      );
    }

    // Permanent Super Admin protection
    if (
      targetUser.email.toLowerCase().trim() === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase() ||
      targetUser.uniqueId === PERMANENT_SUPER_ADMIN_ID
    ) {
      return NextResponse.json(
        { error: "Permanent Super Admin cannot be deleted." },
        { status: 403 }
      );
    }

    const uid = targetUser.id;

    // 1. Delete student submissions & quiz submissions
    await prisma.submission.deleteMany({ where: { studentId: uid } });
    await prisma.quizSubmission.deleteMany({ where: { userId: uid } });

    // 2. Delete enrollments & memberships
    await prisma.enrollment.deleteMany({ where: { userId: uid } });
    await prisma.classroomMember.deleteMany({ where: { userId: uid } });

    // 3. Delete personal records
    await prisma.classroomNote.deleteMany({ where: { userId: uid } });
    await prisma.personalNote.deleteMany({ where: { userId: uid } });
    await prisma.studyLog.deleteMany({ where: { userId: uid } });
    await prisma.personalGoal.deleteMany({ where: { userId: uid } });
    await prisma.notification.deleteMany({ where: { userId: uid } });
    await prisma.emailOtp.deleteMany({ where: { userId: uid } });

    // 4. Delete user messages and announcements
    await prisma.message.deleteMany({ where: { senderId: uid } });
    await prisma.announcement.deleteMany({ where: { authorId: uid } });

    // 5. If user created any classrooms as teacher, cascade their classrooms
    const teacherClassrooms = await prisma.classroom.findMany({
      where: { teacherId: uid },
      select: { id: true },
    });

    if (teacherClassrooms.length > 0) {
      const classIds = teacherClassrooms.map((c) => c.id);
      await prisma.submission.deleteMany({
        where: { assignment: { classroomId: { in: classIds } } },
      });
      await prisma.assignment.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.message.deleteMany({
        where: { channel: { classroomId: { in: classIds } } },
      });
      await prisma.channel.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.announcement.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.classroomNote.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.quizSubmission.deleteMany({
        where: { quiz: { classroomId: { in: classIds } } },
      });
      await prisma.quizQuestion.deleteMany({
        where: { quiz: { classroomId: { in: classIds } } },
      });
      await prisma.quiz.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.classroomMember.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.enrollment.deleteMany({ where: { classroomId: { in: classIds } } });
      await prisma.classroom.deleteMany({ where: { teacherId: uid } });
    }

    // 6. Delete User entity
    await prisma.user.delete({ where: { id: uid } });

    // 7. Clean up secondary stores
    removeUserRole(targetUser.email);
    await deleteFeedbacksByUser(targetUser.id, targetUser.email);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) deleted successfully.`,
      deletedUserId: targetUser.id,
      deletedEmail: targetUser.email,
    });
  } catch (error: any) {
    console.error("Admin user DELETE error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error during user deletion." },
      { status: 500 }
    );
  }
}

