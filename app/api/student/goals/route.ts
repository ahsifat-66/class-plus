import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const goals = await prisma.personalGoal.findMany({
      where: { userId },
      orderBy: { targetDate: "asc" },
    });

    const totalGoals = goals.length;
    const completedCount = goals.filter((g) => g.isCompleted).length;
    const progressPercentage = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;

    return NextResponse.json({
      goals,
      progress: {
        totalGoals,
        completedCount,
        pendingCount: totalGoals - completedCount,
        progressPercentage,
      },
    });
  } catch (error: any) {
    console.error("Error fetching personal goals:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { title, targetDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Goal title is required" }, { status: 400 });
    }

    const parsedDate = targetDate ? new Date(targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Valid target date is required" }, { status: 400 });
    }

    const goal = await prisma.personalGoal.create({
      data: {
        userId,
        title: title.trim(),
        targetDate: parsedDate,
        isCompleted: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        goal,
        message: "Goal added to Academic Locker!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating personal goal:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create personal goal" },
      { status: 500 }
    );
  }
}
