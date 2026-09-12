import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: true,
        enrollments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "asc" },
        },
        channels: {
          orderBy: { createdAt: "asc" },
        },
        announcements: {
          include: {
            author: true,
          },
          orderBy: { createdAt: "desc" },
        },
        assignments: {
          include: {
            submissions: {
              include: {
                student: true,
              },
            },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
