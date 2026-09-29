import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const messages = await prisma.message.findMany({
      where: { channelId: id },
      include: {
        sender: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching channel messages:", error);
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
    const body = await req.json();
    const { content, senderId } = body;

    const actualSenderId = session?.id || senderId;

    if (!content || !actualSenderId) {
      return NextResponse.json(
        { error: "Content and senderId are required" },
        { status: 400 }
      );
    }

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.postPermission === "TEACHERS_ONLY") {
      const isTeacher = channel.classroom.teacherId === actualSenderId;
      if (!isTeacher) {
        return NextResponse.json(
          { error: "Posting is restricted to teachers in this channel." },
          { status: 403 }
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        channelId: id,
        senderId: actualSenderId,
      },
      include: {
        sender: true,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
