import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: classroomId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string" || !password.trim()) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    // Fetch user password hash
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, password: true, role: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    // Check classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true, name: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // Prevent classroom instructor from leaving own class
    if (classroom.teacherId === user.id) {
      return NextResponse.json(
        { error: "Course instructors cannot leave their own classroom. Delete the classroom instead." },
        { status: 403 }
      );
    }

    // Check student enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classroomId: {
          userId: user.id,
          classroomId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You are not enrolled in this classroom." },
        { status: 400 }
      );
    }

    // Remove from Enrollment and ClassroomMember
    await Promise.all([
      prisma.enrollment.deleteMany({
        where: { classroomId, userId: user.id },
      }),
      prisma.classroomMember.deleteMany({
        where: { classroomId, userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully left ${classroom.name}.`,
    });
  } catch (error) {
    console.error("Error leaving classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
