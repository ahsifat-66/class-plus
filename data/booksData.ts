export interface Book {
  id: string;
  title: string;
  subject: string;
  driveUrl: string;
  version: "bangla" | "english";
  grade: string;
  coverImage?: string;
}

export type BookItem = Book;

export interface ClassBooks {
  grade: string;
  className: string;
  versions: {
    banglaVersion: Book[];
    englishVersion: Book[];
  };
}

export const booksData: ClassBooks[] = [
  {
    grade: "class-6",
    className: "ষষ্ঠ শ্রেণি (Class 6)",
    versions: {
      banglaVersion: [
        {
          id: "c6-bn-anondopath",
          title: "আনন্দপাঠ",
          subject: "Bangla Literature",
          driveUrl: "https://drive.google.com/file/d/13TDUiqR-OJ3YBvvHQTfjrHcbzDQFXSOJ/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-grammar",
          title: "বাংলা ব্যাকরণ ও নির্মিতি",
          subject: "Bangla Grammar",
          driveUrl: "https://drive.google.com/file/d/11j56R-5sWDmWtPBqJMj28_KeUAEij0jH/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-charupath",
          title: "চারুপাঠ",
          subject: "Bangla",
          driveUrl: "https://drive.google.com/file/d/1GSE9U5dSZk7pQ3SSwP8r1uh24MT-m7aO/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-math",
          title: "গণিত",
          subject: "Mathematics",
          driveUrl: "https://drive.google.com/file/d/12ZBLI7qQAJZ4pc7jxK0YSMMkKLoXm3aS/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-science",
          title: "বিজ্ঞান",
          subject: "General Science",
          driveUrl: "https://drive.google.com/file/d/1VXemig9nT-EiZxiFrHfqt5ALx7TC6IjU/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-bgs",
          title: "বাংলাদেশ ও বিশ্বপরিচয়",
          subject: "Social Science",
          driveUrl: "https://drive.google.com/file/d/1iKAmdN90NEtjAZWh37RvsGGuzID-wO1V/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-ict",
          title: "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)",
          subject: "ICT",
          driveUrl: "https://drive.google.com/file/d/1ZxZQLeE4oHPH_Z4ZlSHctfaxocttM92J/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-english-today",
          title: "English for Today",
          subject: "English",
          driveUrl: "https://drive.google.com/file/d/1MUGUGnwsZr2SqNpcaEs_xuHvNyHEhvsk/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-english-grammar",
          title: "English Grammar and Composition",
          subject: "English Grammar",
          driveUrl: "https://drive.google.com/file/d/11zjtBmaTVU2sPcyDn-uxFohrbX06P8dC/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-krishi",
          title: "কৃষিশিক্ষা",
          subject: "Agriculture",
          driveUrl: "https://drive.google.com/file/d/1zU3e2MLG3l62PE8cp21vrhaHEJRz9TFS/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-home-science",
          title: "গার্হস্থ্য বিজ্ঞান",
          subject: "Home Science",
          driveUrl: "https://drive.google.com/file/d/1kur5dZhk9mJw38K1MlAs-MiwhPh2ef6u/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-islam",
          title: "ইসলাম ও নৈতিক শিক্ষা",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1Do3S5BNcaPdbl4odV6kob1hKzqz4CWu8/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-hindu",
          title: "হিন্দুধর্ম ও নৈতিক শিক্ষা",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1ar7tY3JZKbq2OhOuJcUn2LsQ4dIN51Y3/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-buddho",
          title: "বৌদ্ধধর্ম ও নৈতিক শিক্ষা",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1VXsXz-XdFnb7lpm5c0XFsO0KqjSNBA3p/view",
          version: "bangla",
          grade: "class-6",
        },
        {
          id: "c6-bn-christian",
          title: "খ্রিষ্টধর্ম ও নৈতিক শিক্ষা",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1xqD7f6J1sppZXgTldzkxNPXxM51JO0_T/view",
          version: "bangla",
          grade: "class-6",
        },
      ],
      englishVersion: [
        {
          id: "c6-en-anandapath",
          title: "Ananda Path",
          subject: "Bangla Literature",
          driveUrl: "https://drive.google.com/file/d/13TDUiqR-OJ3YBvvHQTfjrHcbzDQFXSOJ/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-bangla-grammar",
          title: "Bangla Grammar and Composition",
          subject: "Bangla Grammar",
          driveUrl: "https://drive.google.com/file/d/11j56R-5sWDmWtPBqJMj28_KeUAEij0jH/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-charupath",
          title: "Charupath",
          subject: "Bangla",
          driveUrl: "https://drive.google.com/file/d/1GSE9U5dSZk7pQ3SSwP8r1uh24MT-m7aO/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-english-today",
          title: "English for Today",
          subject: "English",
          driveUrl: "https://drive.google.com/file/d/1MUGUGnwsZr2SqNpcaEs_xuHvNyHEhvsk/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-english-grammar",
          title: "English Grammar and Composition",
          subject: "English Grammar",
          driveUrl: "https://drive.google.com/file/d/11zjtBmaTVU2sPcyDn-uxFohrbX06P8dC/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-mathematics",
          title: "Mathematics",
          subject: "Mathematics",
          driveUrl: "https://drive.google.com/file/d/1_rMDnMhBG9eCXFZ06RM7T5ee8ATI6kfz/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-science",
          title: "Science",
          subject: "General Science",
          driveUrl: "https://drive.google.com/file/d/1DYkOltDdurREi2uWVmCFX9Sm1SiQLBYm/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-bgs",
          title: "Bangladesh and Global Studies",
          subject: "Social Science",
          driveUrl: "https://drive.google.com/file/d/1DYkOltDdurREi2uWVmCFX9Sm1SiQLBYm/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-ict",
          title: "Information and Communication Technology (ICT)",
          subject: "ICT",
          driveUrl: "https://drive.google.com/file/d/1wBi3oQGjRJgVxfwLQi_ZsKW_7ybTbNcD/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-islam",
          title: "Islam and Moral Education",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1W1INmg1ROPAfGZv8i5W5JNmBbP3YJov9/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-hindu",
          title: "Hindu Religion and Moral Education",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1y-GIkqx8qBaJAYHYUzKU6HV-G2UCkSXc/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-buddhist",
          title: "Buddhist Religion and Moral Education",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1ODvMEUv3t0262A-Xw4mCeAtT89OslGmm/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-christian",
          title: "Christian Religion and Moral Education",
          subject: "Religion",
          driveUrl: "https://drive.google.com/file/d/1qVF92fYRkPShmJPxlUv6wd0NLGjXXlMZ/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-agriculture",
          title: "Agricultural Studies",
          subject: "Agriculture",
          driveUrl: "https://drive.google.com/file/d/1Y5XWVUwbrFXX_iN6sV3rLvzGvecDhNOa/view",
          version: "english",
          grade: "class-6",
        },
        {
          id: "c6-en-home-science",
          title: "Home Science",
          subject: "Home Science",
          driveUrl: "https://drive.google.com/file/d/1tLGl98D_UAESTAXpMkINRWIdovaVEudi/view",
          version: "english",
          grade: "class-6",
        },
      ],
    },
  },
];

/**
 * Flat array of all books across all grades and versions for convenient lookup
 */
export const flatBooksData: Book[] = booksData.flatMap((c: ClassBooks) => [
  ...c.versions.banglaVersion,
  ...c.versions.englishVersion,
]);

/**
 * Alias for classBooksData
 */
export const classBooksData: ClassBooks[] = booksData;

/**
 * Helper to get all books
 */
export function getAllBooks(): Book[] {
  return flatBooksData;
}

/**
 * Helper to retrieve books by grade and optional version
 */
export function getBooksByGrade(
  grade?: string | null,
  version?: "bangla" | "english"
): Book[] {
  const c6 = booksData[0];
  if (!grade) {
    if (version === "bangla") return c6.versions.banglaVersion;
    if (version === "english") return c6.versions.englishVersion;
    return flatBooksData;
  }

  const normalized = grade.toLowerCase();
  if (normalized.includes("6")) {
    if (version === "bangla") return c6.versions.banglaVersion;
    if (version === "english") return c6.versions.englishVersion;
    return [...c6.versions.banglaVersion, ...c6.versions.englishVersion];
  }

  return flatBooksData;
}

export default booksData;

