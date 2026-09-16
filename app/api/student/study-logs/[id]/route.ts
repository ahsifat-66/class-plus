import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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
    const existing = await prisma.studyLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another student's study log" },
        { status: 403 }
      );
    }

    await prisma.studyLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Study log removed",
    });
  } catch (error: any) {
    console.error("Error deleting study log:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
