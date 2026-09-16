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
      return NextResponse.json({ user: null, student: null, metrics: null, error: "Unauthorized" }, { status: 200 });
    }

    // Strict Privacy Rule: If a studentId query param is provided, ensure it matches authenticated user
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get("studentId");
    if (requestedStudentId && requestedStudentId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You are strictly limited to your own personal student analytics." },
        { status: 403 }
      );
    }

    // 1. Fetch Student Profile
    const studentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        avatarUrl: true,
        institution: true,
        grade: true,
      },
    });

    if (!studentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch Enrolled Classrooms and Deliverables
    const classrooms = await prisma.classroom.findMany({
      where: {
        OR: [
          { enrollments: { some: { userId } } },
          { members: { some: { userId, role: "STUDENT" } } },
        ],
      },
      include: {
        teacher: { select: { name: true } },
        assignments: {
          include: {
            submissions: {
              where: { studentId: userId },
            },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    const now = new Date();

    // Flatten all deliverables for this student
    const deliverables = classrooms.flatMap((c) =>
      c.assignments.map((a) => {
        const sub = a.submissions[0] || null;
        const isSubmitted = !!sub;
        const dueDate = new Date(a.dueDate);

        let status: "completed" | "pending" | "overdue" = "pending";
        if (isSubmitted) {
          status = "completed";
        } else if (dueDate < now) {
          status = "overdue";
        } else {
          status = "pending";
        }

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          maxPoints: a.maxPoints,
          classroomId: c.id,
          classroomName: c.name,
          subject: c.subject,
          teacherName: c.teacher?.name || "Instructor",
          status,
          isSubmitted,
          submission: sub
            ? {
                id: sub.id,
                grade: sub.grade,
                feedback: sub.feedback,
                submittedAt: sub.submittedAt,
              }
            : null,
        };
      })
    );

    // 3. Assignment Completion Chart (Completed vs Pending vs Overdue)
    const completedCount = deliverables.filter((d) => d.status === "completed").length;
    const pendingCount = deliverables.filter((d) => d.status === "pending").length;
    const overdueCount = deliverables.filter((d) => d.status === "overdue").length;
    const totalAssignments = deliverables.length;

    const completionDistribution = [
      { name: "Completed", value: completedCount, color: "#10b981" },
      { name: "Pending", value: pendingCount, color: "#3b82f6" },
      { name: "Overdue", value: overdueCount, color: "#ef4444" },
    ];

    const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

    // 4. Performance Trend (Line chart of scores over time)
    const gradedList = deliverables
      .filter((d) => d.submission?.grade !== null && d.submission?.grade !== undefined)
      .sort(
        (a, b) =>
          new Date(a.submission!.submittedAt).getTime() -
          new Date(b.submission!.submittedAt).getTime()
      );

    const performanceTrend = gradedList.map((d) => {
      const earned = d.submission!.grade!;
      const max = d.maxPoints || 100;
      const scorePercentage = Math.round((earned / max) * 100);
      const dateStr = new Date(d.submission!.submittedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      return {
        assignment: d.title,
        date: dateStr,
        score: scorePercentage,
        earned,
        max,
        classroom: d.classroomName,
      };
    });

    const averageScore =
      gradedList.length > 0
        ? Math.round(
            (gradedList.reduce(
              (sum, d) => sum + (d.submission!.grade! / (d.maxPoints || 100)) * 100,
              0
            ) /
              gradedList.length) *
              10
          ) / 10
        : null;

    // 5. Weekly Activity (Bar chart of assignments submitted per week for the last 6 weeks)
    const weeklyActivity: Array<{ week: string; count: number; dateRange: string }> = [];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;

    for (let i = 5; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * MS_PER_WEEK);
      const weekStart = new Date(weekEnd.getTime() - 6 * MS_PER_DAY);

      const label = `W${6 - i}`;
      const dateRange = `${weekStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

      const count = deliverables.filter((d) => {
        if (!d.submission?.submittedAt) return false;
        const subDate = new Date(d.submission.submittedAt);
        return subDate >= weekStart && subDate <= weekEnd;
      }).length;

      weeklyActivity.push({
        week: label,
        count,
        dateRange,
      });
    }

    // 6. Self-Study & Academic Locker Analytics
    const [studyLogs, personalGoals, notesCount] = await Promise.all([
      prisma.studyLog.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.personalGoal.findMany({
        where: { userId },
        orderBy: { targetDate: "asc" },
      }),
      prisma.personalNote.count({
        where: { userId },
      }),
    ]);

    // Focus Time calculations
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalFocusMinutes = 0;
    let thisWeekFocusMinutes = 0;
    let thisMonthFocusMinutes = 0;
    const subjectFocusMap: Record<string, number> = {};

    for (const log of studyLogs) {
      const logDate = new Date(log.date);
      totalFocusMinutes += log.durationMinutes;

      if (logDate >= sevenDaysAgo) {
        thisWeekFocusMinutes += log.durationMinutes;
      }
      if (logDate >= thirtyDaysAgo) {
        thisMonthFocusMinutes += log.durationMinutes;
      }

      const subj = log.subject || "General";
      subjectFocusMap[subj] = (subjectFocusMap[subj] || 0) + log.durationMinutes;
    }

    const colorPalette = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316"];
    const subjectBreakdown = Object.entries(subjectFocusMap).map(([subject, minutes], index) => ({
      name: subject,
      subject,
      minutes,
      hours: Math.round((minutes / 60) * 10) / 10,
      value: Math.round((minutes / 60) * 10) / 10,
      color: colorPalette[index % colorPalette.length],
    }));

    // Calculate Study Streak (consecutive days of logged study activity or submitted assignments)
    const activeDatesSet = new Set<string>();
    for (const log of studyLogs) {
      activeDatesSet.add(new Date(log.date).toISOString().split("T")[0]);
    }
    for (const d of deliverables) {
      if (d.submission?.submittedAt) {
        activeDatesSet.add(new Date(d.submission.submittedAt).toISOString().split("T")[0]);
      }
    }

    let studyStreak = 0;
    const checkDate = new Date(now);
    // Check if active today
    const todayStr = checkDate.toISOString().split("T")[0];
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    // If active today or yesterday, streak is currently active
    if (activeDatesSet.has(todayStr) || activeDatesSet.has(yesterdayStr)) {
      let currentCheck = activeDatesSet.has(todayStr) ? checkDate : yesterdayDate;
      while (activeDatesSet.has(currentCheck.toISOString().split("T")[0])) {
        studyStreak++;
        currentCheck = new Date(currentCheck.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    // Personal Goals progress
    const totalGoals = personalGoals.length;
    const completedGoals = personalGoals.filter((g) => g.isCompleted).length;
    const goalsProgressRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return NextResponse.json({
      student: studentUser,
      metrics: {
        enrolledClassesCount: classrooms.length,
        totalAssignments,
        completedCount,
        pendingCount,
        overdueCount,
        completionRate,
        averageScore,
        // Self-study metrics
        totalFocusMinutes,
        totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
        thisWeekFocusMinutes,
        thisWeekFocusHours: Math.round((thisWeekFocusMinutes / 60) * 10) / 10,
        thisMonthFocusMinutes,
        thisMonthFocusHours: Math.round((thisMonthFocusMinutes / 60) * 10) / 10,
        studyStreak,
        notesCount,
        totalGoals,
        completedGoals,
        goalsProgressRate,
      },
      completionDistribution,
      performanceTrend,
      weeklyActivity,
      subjectBreakdown,
      personalGoals,
      recentStudyLogs: studyLogs.slice(0, 5),
      deliverables,
    });
  } catch (error: any) {
    console.error("Student analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
