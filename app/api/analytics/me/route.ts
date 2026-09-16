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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. STUDENT ANALYTICS
    // Fetch all classrooms where the user is enrolled
    const enrolledClassrooms = await prisma.classroom.findMany({
      where: {
        enrollments: {
          some: { userId: user.id },
        },
      },
      include: {
        assignments: {
          include: {
            submissions: {
              where: { studentId: user.id },
            },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    // Flatten all assignments across enrolled classes
    const allStudentAssignments = enrolledClassrooms.flatMap((c) =>
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

    const totalStudentAssignments = allStudentAssignments.length;
    const submittedCount = allStudentAssignments.filter((a) => a.isSubmitted).length;
    const gradedAssignments = allStudentAssignments.filter(
      (a) => a.isSubmitted && a.grade !== null
    );
    const pendingGradingCount = submittedCount - gradedAssignments.length;
    const pendingSubmissionCount = totalStudentAssignments - submittedCount;

    // Overall Average Grade %
    const overallGradeAvg =
      gradedAssignments.length > 0
        ? Math.round(
            (gradedAssignments.reduce(
              (acc, a) => acc + (a.grade! / a.maxPoints) * 100,
              0
            ) /
              gradedAssignments.length) *
              10
          ) / 10
        : 0;

    const completionRate =
      totalStudentAssignments > 0
        ? Math.round((submittedCount / totalStudentAssignments) * 100)
        : 0;

    // Completion distribution chart data
    const completionDistribution = [
      { name: "Graded", value: gradedAssignments.length, color: "#10b981" },
      { name: "Turned In (Pending)", value: pendingGradingCount, color: "#3b82f6" },
      { name: "Pending", value: pendingSubmissionCount, color: "#f59e0b" },
    ];

    // Score history progression chart data
    const scoreHistory = gradedAssignments
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

    // Course-wise breakdown chart data
    const courseBreakdown = enrolledClassrooms.map((c) => {
      const cAssignments = c.assignments;
      const cSubmissions = cAssignments.filter((a) => a.submissions.length > 0);
      const cGraded = cSubmissions.filter((a) => a.submissions[0]?.grade !== null);
      const cAvg =
        cGraded.length > 0
          ? Math.round(
              (cGraded.reduce(
                (sum, a) => sum + (a.submissions[0].grade! / a.maxPoints) * 100,
                0
              ) /
                cGraded.length) *
                10
            ) / 10
          : 0;

      return {
        classroomName: c.name,
        subject: c.subject,
        assignmentsCount: cAssignments.length,
        submittedCount: cSubmissions.length,
        completionRate:
          cAssignments.length > 0
            ? Math.round((cSubmissions.length / cAssignments.length) * 100)
            : 0,
        averageScore: cAvg,
      };
    });

    // 2. TEACHER ANALYTICS
    const teacherClasses = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      include: {
        enrollments: true,
        assignments: {
          include: {
            submissions: true,
          },
        },
      },
    });

    const teacherTotalStudents = teacherClasses.reduce(
      (sum, c) => sum + c.enrollments.length,
      0
    );
    const teacherTotalAssignments = teacherClasses.reduce(
      (sum, c) => sum + c.assignments.length,
      0
    );
    const teacherAllSubmissions = teacherClasses.flatMap((c) =>
      c.assignments.flatMap((a) => a.submissions)
    );
    const teacherGradedSubmissions = teacherAllSubmissions.filter((s) => s.grade !== null);
    const teacherUngradedCount = teacherAllSubmissions.length - teacherGradedSubmissions.length;

    const teacherGradingRate =
      teacherAllSubmissions.length > 0
        ? Math.round(
            (teacherGradedSubmissions.length / teacherAllSubmissions.length) * 100
          )
        : 100;

    const classEnrollmentData = teacherClasses.map((c) => ({
      name: c.name,
      subject: c.subject,
      studentsCount: c.enrollments.length,
      assignmentsCount: c.assignments.length,
      submissionsCount: c.assignments.reduce(
        (sum, a) => sum + a.submissions.length,
        0
      ),
    }));

    return NextResponse.json({
      user,
      student: {
        enrolledCount: enrolledClassrooms.length,
        totalAssignments: totalStudentAssignments,
        submittedCount,
        gradedCount: gradedAssignments.length,
        pendingSubmissionCount,
        pendingGradingCount,
        overallGradeAvg,
        completionRate,
        completionDistribution,
        scoreHistory,
        courseBreakdown,
        recentSubmissions: allStudentAssignments.slice(0, 8),
      },
      teacher: {
        createdCoursesCount: teacherClasses.length,
        totalStudentsCount: teacherTotalStudents,
        assignmentsPostedCount: teacherTotalAssignments,
        submissionsReceivedCount: teacherAllSubmissions.length,
        ungradedCount: teacherUngradedCount,
        gradingRate: teacherGradingRate,
        classEnrollmentData,
      },
    });
  } catch (error) {
    console.error("Analytics me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
