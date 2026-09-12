import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateClassCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      // If no userId provided, return all classrooms
      const classrooms = await prisma.classroom.findMany({
        include: {
          teacher: true,
          enrollments: {
            include: { user: true },
          },
          assignments: true,
          channels: true,
          announcements: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ classrooms });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let classrooms;
    if (user.role === "TEACHER") {
      classrooms = await prisma.classroom.findMany({
        where: { teacherId: user.id },
        include: {
          teacher: true,
          enrollments: {
            include: { user: true },
          },
          assignments: true,
          channels: true,
          announcements: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      classrooms = await prisma.classroom.findMany({
        where: {
          enrollments: {
            some: { userId: user.id },
          },
        },
        include: {
          teacher: true,
          enrollments: {
            include: { user: true },
          },
          assignments: {
            include: {
              submissions: {
                where: { studentId: user.id },
              },
            },
          },
          channels: true,
          announcements: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error("Error listing classrooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, subject, teacherId } = body;

    if (!name || !subject || !teacherId) {
      return NextResponse.json(
        { error: "Name, subject, and teacherId are required" },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateClassCode();
    let existing = await prisma.classroom.findUnique({ where: { code } });
    while (existing) {
      code = generateClassCode();
      existing = await prisma.classroom.findUnique({ where: { code } });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        subject,
        code,
        teacherId,
        channels: {
          create: [
            { name: "announcements" },
            { name: "lab-help" },
            { name: "general" },
          ],
        },
      },
      include: {
        teacher: true,
        channels: true,
        enrollments: true,
      },
    });

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
