import type { Book } from "./booksData";

export interface RawTextbookItem {
  id?: string;
  name: string;
  link: string;
  subject?: string;
}

export interface GroupBooks {
  label: string;
  books: RawTextbookItem[];
}

export interface GradeCurriculumData {
  hasGroups: boolean;
  compulsory: RawTextbookItem[];
  groups?: {
    science: GroupBooks;
    commerce: GroupBooks;
    arts: GroupBooks;
    [key: string]: GroupBooks;
  };
}

export interface TextbooksCatalogMap {
  [gradeKey: string]: GradeCurriculumData;
}

/**
 * Raw textbooks dataset embedded directly into application state
 * as specified by NCTB National Curriculum
 */
export const textbooksData: TextbooksCatalogMap = {
  "9-10": {
    hasGroups: true,
    compulsory: [
      {
        id: "c910-compulsory-sahityo",
        name: "সাহিত্য কণিকা (বাংলা ১ম পত্র)",
        subject: "Bangla Literature",
        link: "https://drive.google.com/file/d/17bH291V5txub-YCrg5ab-o2CA4MKvwD4/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-sohopath",
        name: "সহপাঠ (বাংলা)",
        subject: "Bangla Literature",
        link: "https://drive.google.com/file/d/12WjKZdodXSSzvkwO8_LViQpydKi3zXtw/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-bangla-grammar",
        name: "বাংলা ব্যাকরণ ও নির্মিতি (বাংলা ২য় পত্র)",
        subject: "Bangla Grammar",
        link: "https://drive.google.com/file/d/1leaeW1dOzPZG7rn8bc5fyiIT1TjRgJvN/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-eft",
        name: "English for Today",
        subject: "English",
        link: "https://drive.google.com/file/d/1EekMeoOWO4nVPdCUyvSLA4Y9uuBUONPo/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-egc",
        name: "English Grammar and Composition",
        subject: "English Grammar",
        link: "https://drive.google.com/file/d/1VvKMLPUfuENVBh5lg6_CVsyrf7BegaBC/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-math",
        name: "গণিত",
        subject: "Mathematics",
        link: "https://drive.google.com/file/d/1EKdNO1FRA7SoRafQzEVspEuGI5M1-mkg/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-ict",
        name: "তথ্য ও যোগাযোগ প্রযুক্তি",
        subject: "ICT",
        link: "https://drive.google.com/file/d/1EzubZfMIWg6mbswtaQHpjjxwm-FD4KD8/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-islam",
        name: "ইসলাম ও নৈতিক শিক্ষা",
        subject: "Religion",
        link: "https://drive.google.com/file/d/1rpxIsMK5B3vUihTHxcVVm4ER8nnI4VkV/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-hindu",
        name: "হিন্দুধর্ম ও নৈতিক শিক্ষা",
        subject: "Religion",
        link: "https://drive.google.com/file/d/1HF1YMz5kR7zdmTgkYgUuVHMcW5HU3VOq/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-buddhist",
        name: "বৌদ্ধধর্ম ও নৈতিক শিক্ষা",
        subject: "Religion",
        link: "https://drive.google.com/file/d/1hqH-TNfe_az9JwofCxFEPoJ2x30QnLxD/view?usp=drive_link",
      },
      {
        id: "c910-compulsory-christian",
        name: "খ্রিস্টধর্ম ও নৈতিক শিক্ষা",
        subject: "Religion",
        link: "https://drive.google.com/file/d/1e_CAtdOktysyJydbtGH9WkpTAqg9qmcK/view?usp=drive_link",
      },
    ],
    groups: {
      science: {
        label: "বিজ্ঞান (Science)",
        books: [
          {
            id: "c910-sci-physics",
            name: "পদার্থবিজ্ঞান",
            subject: "Physics",
            link: "https://drive.google.com/file/d/1G_y4t4fW3ZfbgbXSV2fqH4PvHiXApDyu/view?usp=drive_link",
          },
          {
            id: "c910-sci-chemistry",
            name: "রসায়ন",
            subject: "Chemistry",
            link: "https://drive.google.com/file/d/16teUgLDPKTIB8ZOp6dS59DKY-3R7w72L/view?usp=drive_link",
          },
          {
            id: "c910-sci-biology",
            name: "জীববিজ্ঞান",
            subject: "Biology",
            link: "https://drive.google.com/file/d/1zhk3MHn6XUbPTz48ywJcs63A01cwtnzd/view?usp=drive_link",
          },
          {
            id: "c910-sci-higher-math",
            name: "উচ্চতর গণিত",
            subject: "Higher Mathematics",
            link: "https://drive.google.com/file/d/1o6Wf0NbCswP0NhtmZXJowvIvPaA30mVK/view?usp=drive_link",
          },
          {
            id: "c910-sci-bgs",
            name: "বাংলাদেশ ও বিশ্বপরিচয়",
            subject: "Social Science",
            link: "https://drive.google.com/file/d/1KIh7R6J_egWbfD6N-yikdbFMu2SvfG0h/view?usp=drive_link",
          },
        ],
      },
      commerce: {
        label: "ব্যবসায় শিক্ষা (Commerce)",
        books: [
          {
            id: "c910-comm-science",
            name: "বিজ্ঞান (সাধারণ বিজ্ঞান)",
            subject: "General Science",
            link: "https://drive.google.com/file/d/1PMA3U1Pghs7bSAxuyWO12S4ltFerjucj/view?usp=drive_link",
          },
          {
            id: "c910-comm-accounting",
            name: "হিসাববিজ্ঞান",
            subject: "Accounting",
            link: "https://drive.google.com/file/d/1ys1MbQk9EW8wTOan58Rt0YPca53ZYZHP/view?usp=drive_link",
          },
          {
            id: "c910-comm-business-ent",
            name: "ব্যবসায় উদ্যোগ",
            subject: "Business Studies",
            link: "https://drive.google.com/file/d/1OoA-foSjnstGw7OJxB_dvuuF_bm9-R8i/view?usp=drive_link",
          },
          {
            id: "c910-comm-finance",
            name: "ফিন্যান্স ও ব্যাংকিং",
            subject: "Finance & Banking",
            link: "https://drive.google.com/file/d/1gNBkuWDJxYGTNSF9KppN4iGEAWkoIt7Y/view?usp=drive_link",
          },
          {
            id: "c910-comm-agri",
            name: "কৃষিশিক্ষা",
            subject: "Agriculture",
            link: "https://drive.google.com/file/d/1Pz7D9vw1z11B-OQlbDdKFva8_fwrYoY0/view?usp=drive_link",
          },
          {
            id: "c910-comm-home-sci",
            name: "গার্হস্থ্য বিজ্ঞান",
            subject: "Home Science",
            link: "https://drive.google.com/file/d/1HSEx5MnCfB-a6DCeN_RcK0XevcETAa5t/view?usp=drive_link",
          },
        ],
      },
      arts: {
        label: "মানবিক (Arts)",
        books: [
          {
            id: "c910-arts-science",
            name: "বিজ্ঞান (সাধারণ বিজ্ঞান)",
            subject: "General Science",
            link: "https://drive.google.com/file/d/1PMA3U1Pghs7bSAxuyWO12S4ltFerjucj/view?usp=drive_link",
          },
          {
            id: "c910-arts-history",
            name: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা",
            subject: "History",
            link: "https://drive.google.com/file/d/1k1hmA3SfczWmLsJR-QQT8QybAFGkaY4B/view?usp=drive_link",
          },
          {
            id: "c910-arts-geography",
            name: "ভূগোল ও পরিবেশ",
            subject: "Geography",
            link: "https://drive.google.com/file/d/1xBYA6YBstbArM8uAwRSlsiuW8QqMTYRL/view?usp=drive_link",
          },
          {
            id: "c910-arts-civics",
            name: "পৌরনীতি ও নাগরিকতা",
            subject: "Civics & Citizenship",
            link: "https://drive.google.com/file/d/1QdtCDgJ-kRhbm8Vm-x1JIyQsfCQdvY8q/view?usp=drive_link",
          },
          {
            id: "c910-arts-economics",
            name: "অর্থনীতি",
            subject: "Economics",
            link: "https://drive.google.com/file/d/1NVIjVD7hmOM1ZRkhTcOYnUrAqbTWjWH0/view?usp=drive_link",
          },
          {
            id: "c910-arts-agri",
            name: "কৃষিশিক্ষা",
            subject: "Agriculture",
            link: "https://drive.google.com/file/d/1Pz7D9vw1z11B-OQlbDdKFva8_fwrYoY0/view?usp=drive_link",
          },
          {
            id: "c910-arts-home-sci",
            name: "গার্হস্থ্য বিজ্ঞান",
            subject: "Home Science",
            link: "https://drive.google.com/file/d/1HSEx5MnCfB-a6DCeN_RcK0XevcETAa5t/view?usp=drive_link",
          },
        ],
      },
    },
  },
  "11-12": {
    hasGroups: true,
    compulsory: [],
    groups: {
      science: { label: "বিজ্ঞান (Science)", books: [] },
      commerce: { label: "ব্যবসায় শিক্ষা (Commerce)", books: [] },
      arts: { label: "মানবিক (Arts)", books: [] },
    },
  },
};

/**
 * Convert all textbooks in textbooksData into standard Book[] items
 */
export function getGrade9To10FlatBooks(): Book[] {
  const c910 = textbooksData["9-10"];
  if (!c910) return [];

  const results: Book[] = [];
  const addedIds = new Set<string>();

  // 1. Compulsory
  for (const item of c910.compulsory) {
    if (item.id && !addedIds.has(item.id)) {
      addedIds.add(item.id);
      results.push({
        id: item.id,
        title: item.name,
        subject: item.subject || "General",
        driveUrl: item.link,
        version: "bangla",
        grade: "Class 9-10",
      });
    }
  }

  // 2. Groups
  if (c910.groups) {
    for (const groupKey of ["science", "commerce", "arts"] as const) {
      const grp = c910.groups[groupKey];
      if (grp && grp.books) {
        for (const item of grp.books) {
          if (item.id && !addedIds.has(item.id)) {
            addedIds.add(item.id);
            results.push({
              id: item.id,
              title: item.name,
              subject: item.subject || grp.label.split(" ")[0] || "General",
              driveUrl: item.link,
              version: "bangla",
              grade: "Class 9-10",
            });
          }
        }
      }
    }
  }

  return results;
}
