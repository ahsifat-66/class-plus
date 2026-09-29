import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: classroomId, memberId } = params;
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, password: true, role: true },
    });

    if (!teacher || !teacher.password) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can remove students." },
        { status: 403 }
      );
    }

    // Remove from enrollments and members
    await Promise.all([
      prisma.enrollment.deleteMany({
        where: {
          classroomId,
          userId: memberId,
        },
      }),
      prisma.classroomMember.deleteMany({
        where: {
          classroomId,
          userId: memberId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Student successfully removed from classroom roster.",
    });
  } catch (error) {
    console.error("Error removing member from classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
