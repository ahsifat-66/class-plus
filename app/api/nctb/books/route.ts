import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NCTB_CATALOG, getCatalogBooksByGrade } from "@/lib/nctb-catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");

    // Ensure database catalog is synchronized and dummy books are removed
    try {
      const existingBooks = await prisma.nctbBook.findMany();
      const validCatalogIds = new Set(NCTB_CATALOG.map((b) => b.id));

      // Remove any dummy/placeholder books not in official catalog
      const dummyIds = existingBooks
        .filter((b) => !validCatalogIds.has(b.id))
        .map((b) => b.id);

      if (dummyIds.length > 0) {
        await prisma.nctbBook.deleteMany({
          where: { id: { in: dummyIds } },
        });
      }

      // Insert any missing books from the official catalog
      const existingIds = new Set(existingBooks.map((b) => b.id));
      const missingBooks = NCTB_CATALOG.filter((b) => !existingIds.has(b.id));
      if (missingBooks.length > 0) {
        await prisma.nctbBook.createMany({
          data: missingBooks.map((b) => ({
            id: b.id,
            grade: b.grade,
            subject: b.subject,
            title: b.title,
            version: b.version || "bangla",
            driveUrl: b.driveUrl,
            coverImage: b.coverImage || null,
          })),
          skipDuplicates: true,
        });
      }
    } catch (dbErr) {
      console.error("Synchronizing NCTB catalog error:", dbErr);
    }

    // Query books
    let dbBooks: any[] = [];
    try {
      if (grade && grade.trim().length > 0) {
        const trimmed = grade.trim();
        const isClass6 = trimmed.toLowerCase().includes("6");
        dbBooks = await prisma.nctbBook.findMany({
          where: isClass6
            ? {
                OR: [
                  { grade: { equals: "class-6", mode: "insensitive" } },
                  { grade: { equals: "Class 6", mode: "insensitive" } },
                  { grade: { contains: "6" } },
                ],
              }
            : {
                grade: {
                  equals: trimmed,
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
