import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const { id: classroomId, quizId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!quiz || quiz.classroomId !== classroomId) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { selectedAnswers = [] } = body;

    const answersArray: number[] = Array.isArray(selectedAnswers)
      ? selectedAnswers.map((a: any) => (typeof a === "number" ? a : -1))
      : [];

    let score = 0;
    let totalPoints = 0;

    const reviewQuestions = quiz.questions.map((q, idx) => {
      totalPoints += q.points;
      const userSelected = idx < answersArray.length ? answersArray[idx] : -1;
      const isCorrect = userSelected === q.correctOptionIndex;
      if (isCorrect) {
        score += q.points;
      }
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        userSelected,
        isCorrect,
        points: q.points,
      };
    });

    // Upsert submission
    const submission = await prisma.quizSubmission.upsert({
      where: {
        quizId_userId: {
          quizId,
          userId: session.id,
        },
      },
      create: {
        quizId,
        userId: session.id,
        selectedAnswers: answersArray,
        score,
        totalPoints,
        completedAt: new Date(),
      },
      update: {
        selectedAnswers: answersArray,
        score,
        totalPoints,
        completedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submission,
      score,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
      review: reviewQuestions,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
