import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const assignments = await prisma.assignment.findMany({
      where: { classroomId: id },
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
    const { title, description, dueDate, maxPoints } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: "Title, description, and dueDate are required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        maxPoints: Number(maxPoints) || 100,
        classroomId: id,
      },
      include: {
        submissions: true,
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
