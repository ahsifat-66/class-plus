import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { notifyClassroomStudents } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: classroomId } = params;
    const session = await getSessionUser(req);
    const userId = session?.id;

    // Check if teacher
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true, name: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    const isTeacher = classroom.teacherId === userId;

    const quizzes = await prisma.quiz.findMany({
      where: { classroomId },
      include: {
        questions: {
          orderBy: { id: "asc" },
        },
        submissions: {
          include: {
            user: {
              select: { id: true, uniqueId: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { completedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Sanitize questions for students who haven't submitted yet
    const sanitizedQuizzes = quizzes.map((quiz) => {
      const mySubmission = userId
        ? quiz.submissions.find((s) => s.userId === userId)
        : null;

      // If teacher or student already submitted, include full question details with correctOptionIndex
      if (isTeacher || mySubmission) {
        return {
          ...quiz,
          mySubmission,
          submissionsCount: quiz.submissions.length,
          submissions: isTeacher ? quiz.submissions : mySubmission ? [mySubmission] : [],
        };
      }

      // Student has not submitted yet: hide correctOptionIndex
      const safeQuestions = quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points,
      }));

      return {
        ...quiz,
        questions: safeQuestions,
        mySubmission: null,
        submissionsCount: quiz.submissions.length,
        submissions: [],
      };
    });

    return NextResponse.json({ quizzes: sanitizedQuizzes });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
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
      select: { id: true, teacherId: true, name: true },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Only the classroom instructor can create quizzes." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, timeLimitMinutes = 15, dueDate, questions } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Quiz title is required." }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required for a quiz." },
        { status: 400 }
      );
    }

    const validatedQuestions = questions.map((q: any, i: number) => {
      const question = typeof q.question === "string" ? q.question.trim() : `Question ${i + 1}`;
      const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(String) : ["A", "B", "C", "D"];
      let correctOptionIndex = Number(q.correctOptionIndex);
      if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
        correctOptionIndex = 0;
      }
      return {
        question,
        options,
        correctOptionIndex,
        points: Number(q.points) || 1,
      };
    });

    const quiz = await prisma.quiz.create({
      data: {
        classroomId,
        title: title.trim(),
        description: description?.trim() || null,
        timeLimitMinutes: Math.max(1, Number(timeLimitMinutes) || 15),
        dueDate: dueDate ? new Date(dueDate) : null,
        questions: {
          create: validatedQuestions,
        },
      },
      include: {
        questions: true,
        submissions: true,
      },
    });

    // Notify enrolled students
    await notifyClassroomStudents({
      classroomId,
      title: `New Quiz: ${quiz.title}`,
      message: `${quiz.timeLimitMinutes} min limit • ${quiz.questions.length} questions`,
      link: `/classroom/${classroomId}?tab=quizzes`,
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
