import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ user: null, notes: [], subjects: [] }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const search = searchParams.get("search");

    const where: any = { userId };

    if (subject && subject.trim() !== "" && subject.toLowerCase() !== "all") {
      where.subject = { equals: subject.trim(), mode: "insensitive" };
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    const notes = await prisma.personalNote.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    // Fetch user's distinct subjects for filtering tabs
    const allUserNotes = await prisma.personalNote.findMany({
      where: { userId },
      select: { subject: true },
    });

    const standardSubjects = ["Math", "Science", "English", "Computer Science", "History", "General"];
    const uniqueSubjects = Array.from(
      new Set([...standardSubjects, ...allUserNotes.map((n) => n.subject).filter(Boolean)])
    );

    return NextResponse.json({
      notes,
      subjects: uniqueSubjects,
      count: notes.length,
    });
  } catch (error: any) {
    console.error("Error fetching personal notes:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch personal notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, subject, tags, fileUrl } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Note title is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t: any) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string") {
      parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const note = await prisma.personalNote.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        subject: subject && subject.trim() ? subject.trim() : "General",
        tags: parsedTags,
        fileUrl: fileUrl && typeof fileUrl === "string" ? fileUrl.trim() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        note,
        message: "Note saved to Academic Locker!",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating personal note:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create personal note" },
      { status: 500 }
    );
  }
}
