import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { comparePassword, hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [
      teachingCount,
      enrolledCount,
      assignmentsPosted,
      assignmentsSubmitted,
      teacherClasses,
    ] = await Promise.all([
      prisma.classroom.count({ where: { teacherId: user.id } }),
      prisma.enrollment.count({ where: { userId: user.id } }),
      prisma.assignment.count({
        where: { classroom: { teacherId: user.id } },
      }),
      prisma.submission.count({ where: { studentId: user.id } }),
      prisma.classroom.findMany({
        where: { teacherId: user.id },
        select: {
          _count: {
            select: { enrollments: true },
          },
        },
      }),
    ]);

    const totalStudents = teacherClasses.reduce(
      (sum, c) => sum + (c._count?.enrollments || 0),
      0
    );

    const hasTeaching = teachingCount > 0 || user.role === "TEACHER";
    const hasEnrolled = enrolledCount > 0;

    let activeRole = "Student";
    if (hasTeaching && hasEnrolled) {
      activeRole = "Teacher & Student";
    } else if (hasTeaching) {
      activeRole = "Teacher";
    } else {
      activeRole = "Student";
    }

    const stats = {
      teachingCount,
      enrolledCount,
      assignmentsPosted,
      assignmentsSubmitted,
      totalStudents,
      activeRole,
    };

    return NextResponse.json({ user, stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, institution, grade, bio, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      institution?: string | null;
      grade?: string | null;
      bio?: string | null;
      password?: string;
    } = {};

    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (institution !== undefined) {
      updateData.institution = typeof institution === "string" && institution.trim() ? institution.trim() : null;
    }

    if (grade !== undefined) {
      updateData.grade = typeof grade === "string" && grade.trim() ? grade.trim() : null;
    }

    if (bio !== undefined) {
      updateData.bio = typeof bio === "string" && bio.trim() ? bio.trim() : null;
    }

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const isCurrentValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: "Incorrect current password." },
          { status: 400 }
        );
      }

      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters and include at least 1 uppercase letter and 1 number." },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "Profile updated successfully!",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
