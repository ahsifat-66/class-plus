import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { studentId, content } = body;

    if (!studentId || !content) {
      return NextResponse.json(
        { error: "StudentId and submission content are required" },
        { status: 400 }
      );
    }

    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: id,
          studentId,
        },
      },
      update: {
        content,
        submittedAt: new Date(),
      },
      create: {
        assignmentId: id,
        studentId,
        content,
      },
      include: {
        student: true,
        assignment: true,
      },
    });

    return NextResponse.json({ submission, message: "Assignment submitted successfully!" });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
