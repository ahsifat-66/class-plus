import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Error fetching channel:", error);
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

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can modify channel settings." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { postPermission } = body;

    if (postPermission && !["EVERYONE", "TEACHERS_ONLY"].includes(postPermission)) {
      return NextResponse.json(
        { error: "Invalid postPermission value. Must be EVERYONE or TEACHERS_ONLY." },
        { status: 400 }
      );
    }

    const updated = await prisma.channel.update({
      where: { id },
      data: {
        ...(postPermission && { postPermission }),
      },
    });

    return NextResponse.json({ channel: updated });
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
