import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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
    let userId = searchParams.get("userId");
    const type = searchParams.get("type"); // "teaching" | "enrolled" | null

    // Fall back to authenticated session user if not provided in search params
    if (!userId) {
      const session = await getSessionUser(req);
      if (session?.id) {
        userId = session.id;
      }
    }

    if (!userId) {
      // If no userId and not authenticated, return all classrooms
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

    // Fetch classes taught by this user
    const teachingPromise = prisma.classroom.findMany({
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

    // Fetch classes where user is enrolled as student
    const enrolledPromise = prisma.classroom.findMany({
      where: {
        OR: [
          { enrollments: { some: { userId: user.id } } },
          { members: { some: { userId: user.id, role: "STUDENT" } } },
        ],
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

    const [teaching, enrolled] = await Promise.all([teachingPromise, enrolledPromise]);

    let classrooms;
    if (type === "teaching") {
      classrooms = teaching;
    } else if (type === "enrolled") {
      classrooms = enrolled;
    } else {
      classrooms = user.role === "TEACHER" ? teaching : enrolled;
    }

    return NextResponse.json({
      classrooms,
      teaching,
      enrolled,
      counts: {
        teaching: teaching.length,
        enrolled: enrolled.length,
      },
    });
  } catch (error) {
    console.error("Error listing classrooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, subject } = body;
    let { teacherId } = body;

    // 1. Automatically extract teacherId from authenticated session if not in body
    if (!teacherId) {
      const session = await getSessionUser(req);
      if (session?.id) {
        teacherId = session.id;
      }
    }

    // 2. Validate Class Name
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Classroom name is required (e.g. Class 6 or Class 9 A)" },
        { status: 400 }
      );
    }

    // 3. Ensure we have a valid teacher ID
    if (!teacherId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in as a teacher to create a classroom." },
        { status: 401 }
      );
    }

    // Verify teacher exists in the database
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher account not found" },
        { status: 404 }
      );
    }

    // 4. Flexible subject handling: optional with sensible default
    let finalSubject = subject ? subject.trim() : "";
    if (!finalSubject || finalSubject.toLowerCase() === "all") {
      finalSubject = "All Subjects";
    }

    // 5. Generate unique 6-character alphanumeric code
    let code = generateClassCode();
    let existing = await prisma.classroom.findUnique({ where: { code } });
    while (existing) {
      code = generateClassCode();
      existing = await prisma.classroom.findUnique({ where: { code } });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        subject: finalSubject,
        code,
        teacherId,
        channels: {
          create: [
            { name: "announcements" },
            { name: "lab-help" },
            { name: "general" },
          ],
        },
        members: {
          create: {
            userId: teacherId,
            role: "TEACHER",
          },
        },
      },
      include: {
        teacher: true,
        channels: true,
        enrollments: true,
        members: true,
      },
    });

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
