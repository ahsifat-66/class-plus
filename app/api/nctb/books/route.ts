import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NCTB_CATALOG, getCatalogBooksByGrade } from "@/lib/nctb-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");

    // Ensure database catalog is initialized
    try {
      const bookCount = await prisma.nctbBook.count();
      if (bookCount === 0) {
        // Seed catalog into database
        await prisma.nctbBook.createMany({
          data: NCTB_CATALOG.map((b) => ({
            id: b.id,
            grade: b.grade,
            subject: b.subject,
            title: b.title,
            driveUrl: b.driveUrl,
            coverImage: b.coverImage || null,
          })),
          skipDuplicates: true,
        });
      }
    } catch (dbErr) {
      console.error("Auto-seeding NCTB catalog error:", dbErr);
    }

    // Query books
    let dbBooks: any[] = [];
    try {
      if (grade && grade.trim().length > 0) {
        dbBooks = await prisma.nctbBook.findMany({
          where: {
            grade: {
              equals: grade.trim(),
              mode: "insensitive",
            },
          },
          orderBy: { title: "asc" },
        });
      } else {
        dbBooks = await prisma.nctbBook.findMany({
          orderBy: [{ grade: "asc" }, { title: "asc" }],
        });
      }
    } catch (fetchErr) {
      console.error("Error fetching db books:", fetchErr);
    }

    if (dbBooks && dbBooks.length > 0) {
      return NextResponse.json({ books: dbBooks });
    }

    // Fallback to static catalog if DB is momentarily unreachable
    const fallbackBooks = getCatalogBooksByGrade(grade);
    return NextResponse.json({ books: fallbackBooks });
  } catch (error) {
    console.error("NCTB Books route error:", error);
    return NextResponse.json({ error: "Failed to load textbooks" }, { status: 500 });
  }
}
