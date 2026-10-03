import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; quizId: string } }
) {
  try {
    const { id: classroomId, quizId } = params;
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const emailCookie = req.cookies.get("classpulse_user_email")?.value;
      if (emailCookie) {
        const u = await prisma.user.findUnique({
          where: { email: emailCookie },
          select: { id: true, role: true },
        });
        if (u) userId = u.id;
      }
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const isTeacher = Boolean(userId && classroom.teacherId === userId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { id: "asc" },
        },
        submissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { completedAt: "desc" },
        },
      },
    });

    if (!quiz || quiz.classroomId !== classroomId) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const mySubmission = userId
      ? quiz.submissions.find((s) => s.userId === userId)
      : null;

    if (isTeacher || mySubmission) {
      return NextResponse.json({
        quiz: {
          ...quiz,
          mySubmission,
          submissions: isTeacher ? quiz.submissions : mySubmission ? [mySubmission] : [],
        },
      });
    }

    // Hide answers for student taking quiz
    const safeQuestions = quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      points: q.points,
    }));

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: safeQuestions,
        mySubmission: null,
        submissions: [],
      },
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
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

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true },
    });

    if (!classroom || classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can delete quizzes." },
        { status: 403 }
      );
    }

    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
