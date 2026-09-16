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

    const studyLogs = await prisma.studyLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalMinutes = 0;
    let thisWeekMinutes = 0;
    let thisMonthMinutes = 0;

    const subjectMap: Record<string, number> = {};

    for (const log of studyLogs) {
      const logDate = new Date(log.date);
      totalMinutes += log.durationMinutes;

      if (logDate >= sevenDaysAgo) {
        thisWeekMinutes += log.durationMinutes;
      }
      if (logDate >= thirtyDaysAgo) {
        thisMonthMinutes += log.durationMinutes;
      }

      const subj = log.subject || "General";
      subjectMap[subj] = (subjectMap[subj] || 0) + log.durationMinutes;
    }

    const subjectBreakdown = Object.entries(subjectMap).map(([subject, minutes]) => ({
      subject,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
    }));

    return NextResponse.json({
      studyLogs,
      metrics: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        thisWeekMinutes,
        thisWeekHours: Math.round((thisWeekMinutes / 60) * 10) / 10,
        thisMonthMinutes,
        thisMonthHours: Math.round((thisMonthMinutes / 60) * 10) / 10,
        logCount: studyLogs.length,
      },
      subjectBreakdown,
    });
  } catch (error: any) {
    console.error("Error fetching study logs:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch study logs" },
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
    const { subject, durationMinutes, notes, date } = body;

    const parsedDuration = parseInt(String(durationMinutes), 10);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return NextResponse.json(
        { error: "Valid duration in minutes (greater than 0) is required" },
        { status: 400 }
      );
    }

    const studyLog = await prisma.studyLog.create({
      data: {
        userId,
        subject: subject && typeof subject === "string" && subject.trim() ? subject.trim() : "General",
        durationMinutes: parsedDuration,
        notes: notes && typeof notes === "string" ? notes.trim() : null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        studyLog,
        message: "Study session logged successfully!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error logging study session:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log study session" },
      { status: 500 }
    );
  }
}
