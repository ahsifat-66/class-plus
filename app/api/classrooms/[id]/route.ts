import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: true,
        enrollments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
        channels: {
          orderBy: { createdAt: "asc" },
        },
        announcements: {
          include: {
            author: true,
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          include: {
            submissions: {
              include: {
                student: true,
              },
            },
          },
          orderBy: { dueDate: "asc" },
        },
        notes: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
        },
        textbooks: {
          orderBy: { title: "asc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const enrichedClassroom = {
      ...classroom,
      bookIds: (classroom.textbooks || []).map((b) => b.id),
    };

    return NextResponse.json({ classroom: enrichedClassroom });
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can modify this class." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, subject, gradeLevel, textbookIds, bookIds, removeTextbookId } = body;

    const updateData: any = {};
    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (typeof subject === "string") {
      updateData.subject = subject.trim() || "All Subjects";
    }
    if (gradeLevel !== undefined) {
      updateData.gradeLevel = gradeLevel || null;
    }

    const effectiveBookIds = Array.isArray(bookIds)
      ? bookIds
      : Array.isArray(textbookIds)
      ? textbookIds
      : null;

    if (removeTextbookId) {
      updateData.textbooks = {
        disconnect: [{ id: removeTextbookId }],
      };
    } else if (effectiveBookIds !== null) {
      updateData.textbooks = {
        set: effectiveBookIds.map((tid: string) => ({ id: tid })),
      };
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: updateData,
      include: {
        teacher: true,
        textbooks: {
          orderBy: { title: "asc" },
        },
      },
    });

    const enriched = {
      ...updated,
      bookIds: (updated.textbooks || []).map((b) => b.id),
    };

    return NextResponse.json({ classroom: enriched, success: true });
  } catch (error) {
    console.error("Error updating classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      where: { id },
      select: { id: true, teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.teacherId !== teacher.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can delete this class." },
        { status: 403 }
      );
    }

    await prisma.classroom.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Classroom successfully deleted." });
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
