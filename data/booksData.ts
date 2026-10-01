export interface BookItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  version: string;
  driveUrl: string;
  coverImage?: string;
}

export const booksData: BookItem[] = [
  {
    id: "c6-anondopath",
    title: "আনন্দপাঠ",
    subject: "Bangla Literature",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/13TDUiqR-OJ3YBvvHQTfjrHcbzDQFXSOJ/view",
  },
  {
    id: "c6-bangla-grammar",
    title: "বাংলা ব্যাকরণ ও নির্মিতি",
    subject: "Bangla Grammar",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/11j56R-5sWDmWtPBqJMj28_KeUAEij0jH/view",
  },
  {
    id: "c6-charupath",
    title: "চারুপাঠ",
    subject: "Bangla",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1GSE9U5dSZk7pQ3SSwP8r1uh24MT-m7aO/view",
  },
  {
    id: "c6-math",
    title: "গণিত",
    subject: "Mathematics",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/12ZBLI7qQAJZ4pc7jxK0YSMMkKLoXm3aS/view",
  },
  {
    id: "c6-science",
    title: "বিজ্ঞান",
    subject: "General Science",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1VXemig9nT-EiZxiFrHfqt5ALx7TC6IjU/view",
  },
  {
    id: "c6-bgs",
    title: "বাংলাদেশ ও বিশ্বপরিচয়",
    subject: "Social Science",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1iKAmdN90NEtjAZWh37RvsGGuzID-wO1V/view",
  },
  {
    id: "c6-ict",
    title: "তথ্য ও যোগাযোগ প্রযুক্তি (ICT)",
    subject: "ICT",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1ZxZQLeE4oHPH_Z4ZlSHctfaxocttM92J/view",
  },
  {
    id: "c6-english-today",
    title: "English for Today",
    subject: "English",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1MUGUGnwsZr2SqNpcaEs_xuHvNyHEhvsk/view",
  },
  {
    id: "c6-english-grammar",
    title: "English Grammar and Composition",
    subject: "English Grammar",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/11zjtBmaTVU2sPcyDn-uxFohrbX06P8dC/view",
  },
  {
    id: "c6-krishi",
    title: "কৃষিশিক্ষা",
    subject: "Agriculture",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1zU3e2MLG3l62PE8cp21vrhaHEJRz9TFS/view",
  },
  {
    id: "c6-home-science",
    title: "গার্হস্থ্য বিজ্ঞান",
    subject: "Home Science",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1kur5dZhk9mJw38K1MlAs-MiwhPh2ef6u/view",
  },
  {
    id: "c6-islam",
    title: "ইসলাম ও নৈতিক শিক্ষা",
    subject: "Religion",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1Do3S5BNcaPdbl4odV6kob1hKzqz4CWu8/view",
  },
  {
    id: "c6-hindu",
    title: "হিন্দুধর্ম ও নৈতিক শিক্ষা",
    subject: "Religion",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1ar7tY3JZKbq2OhOuJcUn2LsQ4dIN51Y3/view",
  },
  {
    id: "c6-buddho",
    title: "বৌদ্ধধর্ম ও নৈতিক শিক্ষা",
    subject: "Religion",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1VXsXz-XdFnb7lpm5c0XFsO0KqjSNBA3p/view",
  },
  {
    id: "c6-christian",
    title: "খ্রিষ্টধর্ম ও নৈতিক শিক্ষা",
    subject: "Religion",
    grade: "class-6",
    version: "bangla",
    driveUrl: "https://drive.google.com/file/d/1xqD7f6J1sppZXgTldzkxNPXxM51JO0_T/view",
  },
];

export function getBooksByGrade(grade?: string | null): BookItem[] {
  if (!grade) return booksData;
  const normalized = grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
  return booksData.filter((b) => {
    const bGrade = b.grade.trim().toLowerCase().replace(/[\s_]+/g, "-");
    return bGrade === normalized || (normalized.includes("6") && bGrade.includes("6"));
  });
}

export default booksData;
