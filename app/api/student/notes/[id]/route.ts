import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const note = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Strict Privacy: Only the owner can view their note
    if (note.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this note" },
        { status: 403 }
      );
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot edit another student's note" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, subject, tags, fileUrl } = body;

    let parsedTags: string[] | undefined = undefined;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        parsedTags = tags.map((t: any) => String(t).trim()).filter(Boolean);
      } else if (typeof tags === "string") {
        parsedTags = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    const updated = await prisma.personalNote.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        content: content !== undefined ? content.trim() : undefined,
        subject: subject !== undefined ? subject.trim() : undefined,
        tags: parsedTags,
        fileUrl: fileUrl !== undefined ? (fileUrl ? fileUrl.trim() : null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      note: updated,
      message: "Note updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.personalNote.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another student's note" },
        { status: 403 }
      );
    }

    await prisma.personalNote.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted from Academic Locker",
    });
  } catch (error: any) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
