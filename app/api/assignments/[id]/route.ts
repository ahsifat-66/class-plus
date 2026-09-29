import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            teacher: true,
            enrollments: {
              include: { user: true },
            },
          },
        },
        submissions: {
          include: { student: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can modify assignments." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, dueDate, maxPoints, assignToAll, assignedStudentIds } = body;

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(maxPoints !== undefined && { maxPoints: Number(maxPoints) }),
        ...(assignToAll !== undefined && { assignToAll: Boolean(assignToAll) }),
        ...(assignedStudentIds !== undefined && {
          assignedStudentIds: Array.isArray(assignedStudentIds) ? assignedStudentIds : [],
        }),
      },
      include: {
        submissions: {
          include: { student: true },
        },
      },
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { classroom: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.classroom.teacherId !== session.id) {
      return NextResponse.json(
        { error: "Forbidden. Only the course instructor can delete assignments." },
        { status: 403 }
      );
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Assignment deleted successfully." });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
