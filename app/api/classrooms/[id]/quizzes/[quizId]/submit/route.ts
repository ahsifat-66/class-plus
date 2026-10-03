import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

function normalizeUserAnswer(raw: any, options: string[]): number {
  if (typeof raw === "number" && !isNaN(raw) && Number.isInteger(raw)) {
    return raw >= 0 && raw < options.length ? raw : -1;
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return -1;

    // Check if numeric string e.g. "0", "1", ...
    const parsed = parseInt(trimmed, 10);
    if (!isNaN(parsed) && parsed.toString() === trimmed && parsed >= 0 && parsed < options.length) {
      return parsed;
    }

    // Check single letter "A", "B", "C", "D"
    const upper = trimmed.toUpperCase();
    if (upper.length === 1 && upper >= "A" && upper <= "Z") {
      const idx = upper.charCodeAt(0) - 65;
      if (idx >= 0 && idx < options.length) {
        return idx;
      }
    }
    const bnLetters = ["ক", "খ", "গ", "ঘ"];
    const bnIdx = bnLetters.indexOf(trimmed);
    if (bnIdx >= 0 && bnIdx < options.length) {
      return bnIdx;
    }

    // Check exact or normalized text match with options
    const matchIdx = options.findIndex(
      (opt) => opt.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (matchIdx !== -1) {
      return matchIdx;
    }
  }
  return -1;
}

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
    const rawAnswers = Array.isArray(body.selectedAnswers) ? body.selectedAnswers : [];

    const normalizedAnswers: number[] = [];
    let score = 0;
    let totalPoints = 0;

    const reviewQuestions = quiz.questions.map((q, idx) => {
      totalPoints += q.points;
      const rawAns = idx < rawAnswers.length ? rawAnswers[idx] : -1;
      const userSelected = normalizeUserAnswer(rawAns, q.options);
      normalizedAnswers.push(userSelected);

      const correctOptionIndex = Number(q.correctOptionIndex);
      const isCorrect = userSelected >= 0 && userSelected === correctOptionIndex;
      if (isCorrect) {
        score += q.points;
      }
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctOptionIndex,
        userSelected,
        isCorrect,
        points: q.points,
        explanation: q.explanation || null,
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
        selectedAnswers: normalizedAnswers,
        score,
        totalPoints,
        completedAt: new Date(),
      },
      update: {
        selectedAnswers: normalizedAnswers,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const { id: classroomId, quizId } = params;
    const session = await getSessionUser(req);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.quizSubmission.deleteMany({
      where: {
        quizId,
        userId: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Submission reset successfully.",
    });
  } catch (error) {
    console.error("Error resetting quiz submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
