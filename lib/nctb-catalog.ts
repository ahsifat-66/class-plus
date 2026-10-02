import { flatBooksData, Book, booksData } from "@/data/booksData";

export interface NctbBookItem {
  id: string;
  grade: string;
  subject: string;
  title: string;
  version?: string;
  driveUrl: string;
  coverImage?: string;
}

export const NCTB_GRADES = [
  "Class 6",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 7",
  "Class 8",
  "Class 9-10",
  "Class 11-12",
] as const;

export type NctbGrade = typeof NCTB_GRADES[number];

/**
 * Real NCTB Textbooks Catalog (sourced directly from data/booksData.ts)
 */
export const NCTB_CATALOG: NctbBookItem[] = flatBooksData.map((b) => ({
  id: b.id,
  grade: b.grade || "class-6",
  subject: b.subject,
  title: b.title,
  version: b.version,
  driveUrl: b.driveUrl,
  coverImage: b.coverImage,
}));

/**
 * Filter books by grade and optional version
 */
export function getCatalogBooksByGrade(
  grade?: string | null,
  version?: "bangla" | "english"
): NctbBookItem[] {
  let catalog = NCTB_CATALOG;
  if (version) {
    catalog = catalog.filter((b) => b.version === version);
  }
  if (!grade) return catalog;

  const normalized = grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (normalized.includes("9") || normalized.includes("10")) {
    return catalog.filter((b) => {
      const bg = b.grade.toLowerCase();
      return (bg.includes("9") || bg.includes("10")) && !bg.includes("11") && !bg.includes("12");
    });
  }
  if (normalized.includes("11") || normalized.includes("12")) {
    return catalog.filter((b) => {
      const bg = b.grade.toLowerCase();
      return bg.includes("11") || bg.includes("12");
    });
  }

  const filtered = catalog.filter((b) => {
    const bGrade = b.grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
    return bGrade === normalized || (normalized.includes("6") && bGrade.includes("6"));
  });
  if (filtered.length > 0) return filtered;
  if (normalized.includes("6")) {
    return catalog.filter((b) => b.grade.toLowerCase().includes("6"));
  }
  return filtered;
}
