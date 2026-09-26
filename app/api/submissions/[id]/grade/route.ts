import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { grade, feedback } = body;

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...(grade !== undefined && { grade: grade === null ? null : Number(grade) }),
        ...(feedback !== undefined && { feedback: feedback === null ? null : String(feedback) }),
      },
      include: {
        student: true,
        assignment: true,
      },
    });

    return NextResponse.json({ submission, message: "Submission graded successfully!" });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
