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

    if (teacherClasses.length === 0) {
      return NextResponse.json({
        classes: [],
        students: [],
        metrics: {
          totalStudents: 0,
          totalCourses: 0,
          totalAssignments: 0,
          totalSubmissions: 0,
        },
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
      const classAssignmentIds = new Set(c.assignments.map((a) => a.id));

      for (const en of c.enrollments) {
        const s = en.user;
        if (!studentMap.has(s.id)) {
          studentMap.set(s.id, {
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
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
              entry.scores.push({ earned: sub.grade, max: a.maxPoints });
            }
          }
        }
      }
    }

    const students = Array.from(studentMap.values()).map((s) => {
      const averageGrade =
        s.scores.length > 0
          ? Math.round(
              (s.scores.reduce((acc, sc) => acc + (sc.earned / sc.max) * 100, 0) /
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
        const rate = classEnrollmentCount > 0 ? Math.round((turnedIn / classEnrollmentCount) * 100) : 0;

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
            allEarnedPercentages.push(Math.round((sub.grade / a.maxPoints) * 100));
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
