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
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to view teacher analytics." },
        { status: 401 }
      );
    }

    // Verify user exists and check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    // Fetch classrooms taught by this user
    const teacherClasses = await prisma.classroom.findMany({
      where: { teacherId: userId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                avatarUrl: true,
                institution: true,
                grade: true,
              },
            },
          },
        },
        assignments: {
          include: {
            submissions: true,
          },
        },
      },
    });

    // If teacher has 0 classrooms created yet, return complete schema with zero metrics
    // to prevent undefined property crashes on the frontend
    if (teacherClasses.length === 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        classes: [],
        students: [],
        metrics: {
          totalStudents: 0,
          totalActiveStudents: 0,
          totalCourses: 0,
          totalAssignments: 0,
          assignmentsPosted: 0,
          totalSubmissions: 0,
          submissionsPendingGrading: 0,
          gradedSubmissionsCount: 0,
        },
        gradeDistribution: [
          { range: "90-100%", count: 0, color: "#10b981" },
          { range: "80-89%", count: 0, color: "#3b82f6" },
          { range: "70-79%", count: 0, color: "#f59e0b" },
          { range: "<70%", count: 0, color: "#ef4444" },
        ],
        turnInRates: [],
      });
    }

    // Build unique students map across all classrooms
    const studentMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        avatarUrl: string | null;
        institution: string | null;
        grade: string | null;
        classrooms: Array<{ id: string; name: string; subject: string }>;
        totalAssignments: number;
        submittedCount: number;
        gradedCount: number;
        scores: Array<{ earned: number; max: number }>;
      }
    >();

    for (const c of teacherClasses) {
      for (const en of c.enrollments) {
        const s = en.user;
        if (!studentMap.has(s.id)) {
          studentMap.set(s.id, {
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
            avatarUrl: s.avatarUrl || s.avatar,
            institution: s.institution,
            grade: s.grade,
            classrooms: [],
            totalAssignments: 0,
            submittedCount: 0,
            gradedCount: 0,
            scores: [],
          });
        }

        const entry = studentMap.get(s.id)!;
        entry.classrooms.push({ id: c.id, name: c.name, subject: c.subject });
        entry.totalAssignments += c.assignments.length;

        // Calculate submissions for this student in this classroom
        for (const a of c.assignments) {
          const sub = a.submissions.find((sub) => sub.studentId === s.id);
          if (sub) {
            entry.submittedCount++;
            if (sub.grade !== null) {
              entry.gradedCount++;
              const maxPts = a.maxPoints > 0 ? a.maxPoints : 100;
              entry.scores.push({ earned: sub.grade, max: maxPts });
            }
          }
        }
      }
    }

    const students = Array.from(studentMap.values()).map((s) => {
      const averageGrade =
        s.scores.length > 0
          ? Math.round(
              (s.scores.reduce((acc, sc) => acc + (sc.earned / (sc.max || 100)) * 100, 0) /
                s.scores.length) *
                10
            ) / 10
          : null;

      const completionRate =
        s.totalAssignments > 0
          ? Math.round((s.submittedCount / s.totalAssignments) * 100)
          : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        avatar: s.avatar,
        avatarUrl: s.avatarUrl,
        institution: s.institution,
        grade: s.grade,
        classrooms: s.classrooms,
        totalAssignments: s.totalAssignments,
        submittedCount: s.submittedCount,
        gradedCount: s.gradedCount,
        completionRate,
        averageGrade,
      };
    });

    // Calculate total submissions pending grading
    let pendingGradingCount = 0;
    const allTeacherAssignments: Array<{
      id: string;
      title: string;
      classroomName: string;
      dueDate: Date;
      totalEnrolled: number;
      turnedInCount: number;
      missingCount: number;
      turnInRate: number;
    }> = [];

    // All grades for performance distribution
    const allEarnedPercentages: number[] = [];

    for (const c of teacherClasses) {
      const classEnrollmentCount = c.enrollments.length;

      for (const a of c.assignments) {
        const turnedIn = a.submissions.length;
        const missing = Math.max(0, classEnrollmentCount - turnedIn);
        const rate =
          classEnrollmentCount > 0
            ? Math.round((turnedIn / classEnrollmentCount) * 100)
            : 0;

        allTeacherAssignments.push({
          id: a.id,
          title: a.title,
          classroomName: c.name,
          dueDate: a.dueDate,
          totalEnrolled: classEnrollmentCount,
          turnedInCount: turnedIn,
          missingCount: missing,
          turnInRate: rate,
        });

        for (const sub of a.submissions) {
          if (sub.grade === null) {
            pendingGradingCount++;
          } else {
            const maxPts = a.maxPoints > 0 ? a.maxPoints : 100;
            allEarnedPercentages.push(Math.round((sub.grade / maxPts) * 100));
          }
        }
      }
    }

    // Performance Distribution brackets: 90-100%, 80-89%, 70-79%, <70%
    const gradeDistribution = [
      {
        range: "90-100%",
        count: allEarnedPercentages.filter((p) => p >= 90).length,
        color: "#10b981",
      },
      {
        range: "80-89%",
        count: allEarnedPercentages.filter((p) => p >= 80 && p < 90).length,
        color: "#3b82f6",
      },
      {
        range: "70-79%",
        count: allEarnedPercentages.filter((p) => p >= 70 && p < 80).length,
        color: "#f59e0b",
      },
      {
        range: "<70%",
        count: allEarnedPercentages.filter((p) => p < 70).length,
        color: "#ef4444",
      },
    ];

    const classesList = teacherClasses.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      code: c.code,
      studentCount: c.enrollments.length,
      assignmentCount: c.assignments.length,
    }));

    const totalAssignmentsCount = teacherClasses.reduce(
      (sum, c) => sum + c.assignments.length,
      0
    );

    const totalSubmissionsCount = teacherClasses.reduce(
      (sum, c) =>
        sum +
        c.assignments.reduce((s, a) => s + a.submissions.length, 0),
      0
    );

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      classes: classesList,
      students,
      metrics: {
        totalStudents: students.length,
        totalActiveStudents: students.length,
        totalCourses: teacherClasses.length,
        totalAssignments: totalAssignmentsCount,
        assignmentsPosted: totalAssignmentsCount,
        totalSubmissions: totalSubmissionsCount,
        submissionsPendingGrading: pendingGradingCount,
        gradedSubmissionsCount: allEarnedPercentages.length,
      },
      gradeDistribution,
      turnInRates: allTeacherAssignments,
    });
  } catch (error) {
    console.error("Teacher analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching teacher analytics." },
      { status: 500 }
    );
  }
}
