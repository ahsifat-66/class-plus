import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getSessionUser(req);
    let requesterId = session?.id;

    if (!requesterId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) requesterId = found.id;
      }
    }

    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetStudentId = params.studentId;

    // 1. Strict RBAC Verification
    const isSelf = requesterId === targetStudentId;

    let isAuthorizedTeacher = false;
    if (!isSelf) {
      // Check if requester teaches at least one course where target student is enrolled
      const sharedClass = await prisma.classroom.findFirst({
        where: {
          teacherId: requesterId,
          enrollments: {
            some: { userId: targetStudentId },
          },
        },
      });

      if (sharedClass) {
        isAuthorizedTeacher = true;
      }
    }

    if (!isSelf && !isAuthorizedTeacher) {
      return NextResponse.json(
        {
          error:
            "Access denied. You do not have permission to view this student's analytics.",
        },
        { status: 403 }
      );
    }

    // 2. Fetch target student profile
    const student = await prisma.user.findUnique({
      where: { id: targetStudentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 3. Fetch classrooms
    // If teacher, only include classrooms taught by this teacher (or all if self)
    const classroomFilter: any = {
      enrollments: {
        some: { userId: targetStudentId },
      },
    };

    if (isAuthorizedTeacher && !isSelf) {
      classroomFilter.teacherId = requesterId;
    }

    const classrooms = await prisma.classroom.findMany({
      where: classroomFilter,
      include: {
        assignments: {
          include: {
            submissions: {
              where: { studentId: targetStudentId },
            },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    // 4. Compute student metrics and chart data
    const allAssignments = classrooms.flatMap((c) =>
      c.assignments.map((a) => {
        const submission = a.submissions[0] || null;
        return {
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          maxPoints: a.maxPoints,
          classroomName: c.name,
          subject: c.subject,
          isSubmitted: !!submission,
          grade: submission?.grade ?? null,
          feedback: submission?.feedback ?? null,
          submittedAt: submission?.submittedAt ?? null,
        };
      })
    );

    const totalAssignments = allAssignments.length;
    const submittedAssignments = allAssignments.filter((a) => a.isSubmitted);
    const gradedAssignments = submittedAssignments.filter((a) => a.grade !== null);
    const pendingGradingCount = submittedAssignments.length - gradedAssignments.length;
    const pendingSubmissionCount = totalAssignments - submittedAssignments.length;

    const averageGrade =
      gradedAssignments.length > 0
        ? Math.round(
            (gradedAssignments.reduce(
              (acc, a) => acc + (a.grade! / a.maxPoints) * 100,
              0
            ) /
              gradedAssignments.length) *
              10
          ) / 10
        : null;

    const completionRate =
      totalAssignments > 0
        ? Math.round((submittedAssignments.length / totalAssignments) * 100)
        : 0;

    const completionDistribution = [
      { name: "Graded", value: gradedAssignments.length, color: "#10b981" },
      { name: "Turned In (Pending)", value: pendingGradingCount, color: "#3b82f6" },
      { name: "Pending", value: pendingSubmissionCount, color: "#f59e0b" },
    ];

    const scoreProgression = gradedAssignments
      .sort((a, b) => new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime())
      .map((a) => ({
        assignment: a.title,
        date: new Date(a.submittedAt!).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        scorePercentage: Math.round((a.grade! / a.maxPoints) * 100),
        earned: a.grade!,
        max: a.maxPoints,
        subject: a.subject,
      }));

    return NextResponse.json({
      student,
      metrics: {
        totalAssignments,
        submittedCount: submittedAssignments.length,
        gradedCount: gradedAssignments.length,
        pendingSubmissionCount,
        pendingGradingCount,
        averageGrade,
        completionRate,
      },
      completionDistribution,
      scoreProgression,
      assignments: allAssignments,
      classrooms: classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
      })),
    });
  } catch (error) {
    console.error("Student drill-down analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
