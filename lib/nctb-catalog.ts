import { booksData, BookItem } from "@/data/booksData";

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
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
] as const;

export type NctbGrade = typeof NCTB_GRADES[number];

/**
 * Real NCTB Textbooks Catalog (sourced directly from data/booksData.ts)
 */
export const NCTB_CATALOG: NctbBookItem[] = booksData.map((b) => ({
  id: b.id,
  grade: b.grade,
  subject: b.subject,
  title: b.title,
  version: b.version,
  driveUrl: b.driveUrl,
  coverImage: b.coverImage,
}));

/**
 * Filter books by grade (supports "Class 6", "class-6", "class 6", etc.)
 */
export function getCatalogBooksByGrade(grade?: string | null): NctbBookItem[] {
  if (!grade) return NCTB_CATALOG;
  const normalized = grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const filtered = NCTB_CATALOG.filter((b) => {
    const bGrade = b.grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
    return bGrade === normalized || (normalized.includes("6") && bGrade.includes("6"));
  });
  if (filtered.length > 0) return filtered;
  if (normalized.includes("6")) {
    return NCTB_CATALOG.filter((b) => b.grade.toLowerCase().includes("6"));
  }
  return filtered;
}
