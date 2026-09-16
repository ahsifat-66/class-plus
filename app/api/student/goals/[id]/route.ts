import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function PATCH(
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
    const existing = await prisma.personalGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify another student's goal" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, targetDate, isCompleted } = body;

    const updated = await prisma.personalGoal.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        isCompleted: typeof isCompleted === "boolean" ? isCompleted : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      goal: updated,
      message: "Goal updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating goal:", error);
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
    const existing = await prisma.personalGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    if (existing.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another student's goal" },
        { status: 403 }
      );
    }

    await prisma.personalGoal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Goal removed",
    });
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
