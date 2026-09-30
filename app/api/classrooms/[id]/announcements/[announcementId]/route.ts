import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  try {
    const { id: classroomId, announcementId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement || announcement.classroomId !== classroomId) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Must be either classroom teacher or the announcement author
    if (classroom.teacherId !== session.id && announcement.authorId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to edit this announcement." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Announcement content cannot be empty." }, { status: 400 });
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(title && { title: title.trim() }),
        content: content.trim(),
        isEdited: true,
      },
      include: {
        author: true,
      },
    });

    return NextResponse.json({ announcement: updated });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  try {
    const { id: classroomId, announcementId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement || announcement.classroomId !== classroomId) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Must be classroom teacher or announcement author
    if (classroom.teacherId !== session.id && announcement.authorId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to delete this announcement." },
        { status: 403 }
      );
    }

    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({ success: true, message: "Announcement deleted successfully." });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
