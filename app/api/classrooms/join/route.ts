import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { code, userId } = body;

    // Fall back to session user if userId not provided in body
    if (!userId) {
      const session = await getSessionUser();
      if (session?.id) {
        userId = session.id;
      }
    }

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Class code is required and user must be signed in" },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    const classroom = await prisma.classroom.findUnique({
      where: { code: trimmedCode },
      include: {
        teacher: true,
        channels: true,
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Invalid class code. No classroom matches this code." },
        { status: 404 }
      );
    }

    // Check if already enrolled in Enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classroomId: {
          userId,
          classroomId: classroom.id,
        },
      },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          userId,
          classroomId: classroom.id,
        },
      });
    }

    // Also sync ClassroomMember
    const existingMember = await prisma.classroomMember.findUnique({
      where: {
        userId_classroomId: {
          userId,
          classroomId: classroom.id,
        },
      },
    });

    if (!existingMember) {
      await prisma.classroomMember.create({
        data: {
          userId,
          classroomId: classroom.id,
          role: classroom.teacherId === userId ? "TEACHER" : "STUDENT",
        },
      });
    }

    return NextResponse.json({
      classroom,
      message: existingEnrollment
        ? "Already enrolled in this classroom"
        : "Successfully enrolled in classroom",
    });
  } catch (error) {
    console.error("Error joining classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
