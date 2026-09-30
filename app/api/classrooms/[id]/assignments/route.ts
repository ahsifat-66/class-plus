import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { notifyClassroomStudents } from "@/lib/notifications";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);

    // If user is a student, only show assignments where assignToAll is true OR student ID is targeted
    const isStudent = session?.role === "STUDENT";

    const assignments = await prisma.assignment.findMany({
      where: {
        classroomId: id,
        ...(isStudent && session?.id
          ? {
              OR: [
                { assignToAll: true },
                { assignedStudentIds: { has: session.id } },
              ],
            }
          : {}),
      },
      include: {
        submissions: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      title,
      description,
      dueDate,
      maxPoints,
      assignToAll = true,
      assignedStudentIds = [],
    } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: "Title, description, and dueDate are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate),
        maxPoints: Number(maxPoints) || 100,
        assignToAll: Boolean(assignToAll),
        assignedStudentIds: Array.isArray(assignedStudentIds) ? assignedStudentIds : [],
        classroomId: id,
      },
      include: {
        submissions: true,
      },
    });

    // Notify enrolled students
    await notifyClassroomStudents({
      classroomId: id,
      title: `New Assignment: ${assignment.title}`,
      message: `Due on ${new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} • ${assignment.maxPoints} pts`,
      link: `/classroom/${id}?tab=classwork`,
      targetStudentIds: assignment.assignToAll ? undefined : assignment.assignedStudentIds,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
