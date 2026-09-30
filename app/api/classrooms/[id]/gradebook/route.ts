import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function escapeCsvCell(cell: any): string {
  const str = String(cell ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: classroomId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        assignments: {
          include: {
            submissions: true,
          },
          orderBy: { createdAt: "asc" },
        },
        quizzes: {
          include: {
            questions: { select: { points: true } },
            submissions: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can export the gradebook." },
        { status: 403 }
      );
    }

    // Build CSV Headers
    const headers: string[] = ["Student Name", "Student Email"];

    classroom.assignments.forEach((a) => {
      headers.push(`Assignment: ${a.title} (Max ${a.maxPoints})`);
    });

    classroom.quizzes.forEach((q) => {
      const qMax = q.questions.reduce((sum, item) => sum + (item.points || 1), 0);
      headers.push(`Quiz: ${q.title} (Max ${qMax})`);
    });

    headers.push("Total Earned Points");
    headers.push("Total Possible Points");
    headers.push("Overall Average (%)");

    // Build Rows for each enrolled student
    const rows: string[][] = [];

    classroom.enrollments.forEach((enr) => {
      const student = enr.user;
      const row: string[] = [student.name, student.email];

      let studentEarnedPoints = 0;
      let studentPossiblePoints = 0;

      // Assignment scores
      classroom.assignments.forEach((a) => {
        const sub = a.submissions.find((s) => s.studentId === student.id);
        if (sub && sub.grade !== null) {
          row.push(`${sub.grade}`);
          studentEarnedPoints += sub.grade;
        } else if (sub) {
          row.push("Ungraded");
        } else {
          row.push("Not Submitted");
        }
        studentPossiblePoints += a.maxPoints;
      });

      // Quiz scores
      classroom.quizzes.forEach((q) => {
        const qMax = q.questions.reduce((sum, item) => sum + (item.points || 1), 0);
        const sub = q.submissions.find((s) => s.userId === student.id);
        if (sub) {
          row.push(`${sub.score}`);
          studentEarnedPoints += sub.score;
        } else {
          row.push("Not Taken");
        }
        studentPossiblePoints += qMax;
      });

      const avgPct =
        studentPossiblePoints > 0
          ? Math.round((studentEarnedPoints / studentPossiblePoints) * 100)
          : 0;

      row.push(String(studentEarnedPoints));
      row.push(String(studentPossiblePoints));
      row.push(`${avgPct}%`);

      rows.push(row);
    });

    // Generate CSV Content
    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((r) => r.map(escapeCsvCell).join(",")),
    ].join("\r\n");

    const sanitizedClassName = classroom.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `Gradebook_${sanitizedClassName}_${dateStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating gradebook CSV:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
