import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { noteId } = params;
    const note = await prisma.classroomNote.findUnique({
      where: { id: noteId },
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

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { noteId } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await prisma.classroomNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the author can edit this note." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, subject, content, fileUrl, fileName, driveUrl } = body;

    const updated = await prisma.classroomNote.update({
      where: { id: noteId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(content !== undefined && { content: content ? content.trim() : null }),
        ...(fileUrl !== undefined && { fileUrl: fileUrl || null }),
        ...(fileName !== undefined && { fileName: fileName || null }),
        ...(driveUrl !== undefined && { driveUrl: driveUrl ? driveUrl.trim() : null }),
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

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { id, noteId } = params;
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Account password is required to verify note deletion." },
        { status: 401 }
      );
    }

    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect account password. Verification failed." },
        { status: 401 }
      );
    }

    const note = await prisma.classroomNote.findUnique({
      where: { id: noteId },
      include: { classroom: true },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const isAuthor = note.userId === user.id;
    const isTeacher = note.classroom.teacherId === user.id;

    if (!isAuthor && !isTeacher) {
      return NextResponse.json(
        { error: "Forbidden. Only the note author or classroom instructor can delete this note." },
        { status: 403 }
      );
    }

    await prisma.classroomNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true, message: "Note deleted successfully." });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
