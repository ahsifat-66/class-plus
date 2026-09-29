import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const { messageId } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only the author can edit their message
    if (message.senderId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only edit your own messages." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Message content cannot be empty." },
        { status: 400 }
      );
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
      },
      include: {
        sender: true,
      },
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const { messageId } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            classroom: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Message author OR classroom teacher can delete
    const isAuthor = message.senderId === session.id;
    const isTeacher = message.channel.classroom.teacherId === session.id;

    if (!isAuthor && !isTeacher) {
      return NextResponse.json(
        { error: "Forbidden. Only the author or teacher can delete this message." },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
