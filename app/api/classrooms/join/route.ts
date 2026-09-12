import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Class code and userId are required" },
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

    // Check if already enrolled
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
