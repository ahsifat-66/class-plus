import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const notes = await prisma.classroomNote.findMany({
      where: { classroomId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching classroom notes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is enrolled or teacher
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        enrollments: {
          where: { userId: session.id },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const isTeacher = classroom.teacherId === session.id;
    const isEnrolled = classroom.enrollments.length > 0;

    if (!isTeacher && !isEnrolled) {
      return NextResponse.json(
        { error: "Forbidden. You must be a member of this classroom to publish notes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subject, content, fileUrl, fileName, driveUrl } = body;

    if (!title || !title.trim() || !subject || !subject.trim()) {
      return NextResponse.json(
        { error: "Title and subject are required." },
        { status: 400 }
      );
    }

    const note = await prisma.classroomNote.create({
      data: {
        classroomId: id,
        userId: session.id,
        title: title.trim(),
        subject: subject.trim(),
        content: content ? content.trim() : null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        driveUrl: driveUrl ? driveUrl.trim() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
