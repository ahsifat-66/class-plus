export interface NctbBookItem {
  id: string;
  grade: string;
  subject: string;
  title: string;
  driveUrl: string;
  coverImage?: string;
}

export const NCTB_GRADES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
] as const;

export type NctbGrade = typeof NCTB_GRADES[number];

export const NCTB_CATALOG: NctbBookItem[] = [
  // ===================== CLASS 1 =====================
  {
    id: "c1-bangla",
    grade: "Class 1",
    subject: "Bangla",
    title: "আমার বাংলা বই (প্রথম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c1-english",
    grade: "Class 1",
    subject: "English",
    title: "English for Today (Class 1)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c1-math",
    grade: "Class 1",
    subject: "Mathematics",
    title: "প্রাথমিক গণিত (প্রথম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },

  // ===================== CLASS 2 =====================
  {
    id: "c2-bangla",
    grade: "Class 2",
    subject: "Bangla",
    title: "আমার বাংলা বই (দ্বিতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c2-english",
    grade: "Class 2",
    subject: "English",
    title: "English for Today (Class 2)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c2-math",
    grade: "Class 2",
    subject: "Mathematics",
    title: "প্রাথমিক গণিত (দ্বিতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },

  // ===================== CLASS 3 =====================
  {
    id: "c3-bangla",
    grade: "Class 3",
    subject: "Bangla",
    title: "আমার বাংলা বই (তৃতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c3-english",
    grade: "Class 3",
    subject: "English",
    title: "English for Today (Class 3)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c3-math",
    grade: "Class 3",
    subject: "Mathematics",
    title: "প্রাথমিক গণিত (তৃতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c3-science",
    grade: "Class 3",
    subject: "Science",
    title: "প্রাথমিক বিজ্ঞান (তৃতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c3-bgs",
    grade: "Class 3",
    subject: "Bangladesh & Global Studies",
    title: "বাংলাদেশ ও বিশ্বপরিচয় (তৃতীয় শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // ===================== CLASS 4 =====================
  {
    id: "c4-bangla",
    grade: "Class 4",
    subject: "Bangla",
    title: "আমার বাংলা বই (চতুর্থ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c4-english",
    grade: "Class 4",
    subject: "English",
    title: "English for Today (Class 4)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c4-math",
    grade: "Class 4",
    subject: "Mathematics",
    title: "প্রাথমিক গণিত (চতুর্থ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c4-science",
    grade: "Class 4",
    subject: "Science",
    title: "প্রাথমিক বিজ্ঞান (চতুর্থ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c4-bgs",
    grade: "Class 4",
    subject: "Bangladesh & Global Studies",
    title: "বাংলাদেশ ও বিশ্বপরিচয় (চতুর্থ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // ===================== CLASS 5 =====================
  {
    id: "c5-bangla",
    grade: "Class 5",
    subject: "Bangla",
    title: "আমার বাংলা বই (পঞ্চম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c5-english",
    grade: "Class 5",
    subject: "English",
    title: "English for Today (Class 5)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c5-math",
    grade: "Class 5",
    subject: "Mathematics",
    title: "প্রাথমিক গণিত (পঞ্চম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c5-science",
    grade: "Class 5",
    subject: "Science",
    title: "প্রাথমিক বিজ্ঞান (পঞ্চম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c5-bgs",
    grade: "Class 5",
    subject: "Bangladesh & Global Studies",
    title: "বাংলাদেশ ও বিশ্বপরিচয় (পঞ্চম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // ===================== CLASS 6 =====================
  {
    id: "c6-bangla",
    grade: "Class 6",
    subject: "Bangla",
    title: "বাংলা (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c6-english",
    grade: "Class 6",
    subject: "English",
    title: "English (Class 6)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c6-math",
    grade: "Class 6",
    subject: "Mathematics",
    title: "গণিত (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c6-science-inq",
    grade: "Class 6",
    subject: "Science",
    title: "বিজ্ঞান অনুসন্ধানী পাঠ (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c6-science-prac",
    grade: "Class 6",
    subject: "Science",
    title: "বিজ্ঞান অনুশীলন পাঠ (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c6-history",
    grade: "Class 6",
    subject: "History & Social Science",
    title: "ইতিহাস ও সামাজিক বিজ্ঞান (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c6-digital-tech",
    grade: "Class 6",
    subject: "Digital Technology",
    title: "ডিজিটাল প্রযুক্তি (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c6-life-livelihood",
    grade: "Class 6",
    subject: "Life & Livelihood",
    title: "জীবন ও জীবিকা (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1L2lE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c6-health",
    grade: "Class 6",
    subject: "Wellbeing & Health",
    title: "স্বাস্থ্য সুরক্ষা (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1H3lE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c6-art-culture",
    grade: "Class 6",
    subject: "Art & Culture",
    title: "শিল্প ও সংস্কৃতি (ষষ্ঠ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A4lE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },

  // ===================== CLASS 7 =====================
  {
    id: "c7-bangla",
    grade: "Class 7",
    subject: "Bangla",
    title: "বাংলা (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c7-english",
    grade: "Class 7",
    subject: "English",
    title: "English (Class 7)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c7-math",
    grade: "Class 7",
    subject: "Mathematics",
    title: "গণিত (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c7-science-inq",
    grade: "Class 7",
    subject: "Science",
    title: "বিজ্ঞান অনুসন্ধানী পাঠ (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c7-science-prac",
    grade: "Class 7",
    subject: "Science",
    title: "বিজ্ঞান অনুশীলন পাঠ (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c7-history",
    grade: "Class 7",
    subject: "History & Social Science",
    title: "ইতিহাস ও সামাজিক বিজ্ঞান (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c7-digital-tech",
    grade: "Class 7",
    subject: "Digital Technology",
    title: "ডিজিটাল প্রযুক্তি (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c7-life-livelihood",
    grade: "Class 7",
    subject: "Life & Livelihood",
    title: "জীবন ও জীবিকা (সপ্তম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1L2lE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },

  // ===================== CLASS 8 =====================
  {
    id: "c8-bangla",
    grade: "Class 8",
    subject: "Bangla",
    title: "বাংলা (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c8-english",
    grade: "Class 8",
    subject: "English",
    title: "English (Class 8)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c8-math",
    grade: "Class 8",
    subject: "Mathematics",
    title: "গণিত (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c8-science-inq",
    grade: "Class 8",
    subject: "Science",
    title: "বিজ্ঞান অনুসন্ধানী পাঠ (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c8-science-prac",
    grade: "Class 8",
    subject: "Science",
    title: "বিজ্ঞান অনুশীলন পাঠ (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1S3eN4wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c8-history",
    grade: "Class 8",
    subject: "History & Social Science",
    title: "ইতিহাস ও সামাজিক বিজ্ঞান (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c8-digital-tech",
    grade: "Class 8",
    subject: "Digital Technology",
    title: "ডিজিটাল প্রযুক্তি (অষ্টম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },

  // ===================== CLASS 9 & 10 (Secondary) =====================
  {
    id: "c910-bangla-sahitya",
    grade: "Class 9",
    subject: "Bangla",
    title: "বাংলা সাহিত্য (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c910-bangla-sahopath",
    grade: "Class 9",
    subject: "Bangla",
    title: "বাংলা সহপাঠ (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c910-english",
    grade: "Class 9",
    subject: "English",
    title: "English for Today (Classes 9-10)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c910-math",
    grade: "Class 9",
    subject: "Mathematics",
    title: "সাধারণ গণিত (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c910-higher-math",
    grade: "Class 9",
    subject: "Higher Mathematics",
    title: "উচ্চতর গণিত (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c910-physics",
    grade: "Class 9",
    subject: "Physics",
    title: "পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1P1yS2iC7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c910-chemistry",
    grade: "Class 9",
    subject: "Chemistry",
    title: "রসায়ন (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1hE2mI7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c910-biology",
    grade: "Class 9",
    subject: "Biology",
    title: "জীববিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B1iO2lO7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c910-ict",
    grade: "Class 9",
    subject: "ICT",
    title: "তথ্য ও যোগাযোগ প্রযুক্তি (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c910-bgs",
    grade: "Class 9",
    subject: "Bangladesh & Global Studies",
    title: "বাংলাদেশ ও বিশ্বপরিচয় (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B8gS3wR9t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c910-accounting",
    grade: "Class 9",
    subject: "Accounting",
    title: "হিসাববিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c910-business",
    grade: "Class 9",
    subject: "Business Studies",
    title: "ব্যবসায় উদ্যোগ (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B1uS2iN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c910-finance",
    grade: "Class 9",
    subject: "Finance & Banking",
    title: "ফিন্যান্স ও ব্যাংকিং (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1F1iN2aN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // Class 10 duplicated reference pointing to Class 9-10 textbooks for easy selection
  {
    id: "c10-bangla-sahitya",
    grade: "Class 10",
    subject: "Bangla",
    title: "বাংলা সাহিত্য (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c10-english",
    grade: "Class 10",
    subject: "English",
    title: "English for Today (Classes 9-10)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c10-math",
    grade: "Class 10",
    subject: "Mathematics",
    title: "সাধারণ গণিত (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c10-higher-math",
    grade: "Class 10",
    subject: "Higher Mathematics",
    title: "উচ্চতর গণিত (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c10-physics",
    grade: "Class 10",
    subject: "Physics",
    title: "পদার্থবিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1P1yS2iC7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c10-chemistry",
    grade: "Class 10",
    subject: "Chemistry",
    title: "রসায়ন (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1hE2mI7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c10-biology",
    grade: "Class 10",
    subject: "Biology",
    title: "জীববিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B1iO2lO7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c10-ict",
    grade: "Class 10",
    subject: "ICT",
    title: "তথ্য ও যোগাযোগ প্রযুক্তি (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c10-accounting",
    grade: "Class 10",
    subject: "Accounting",
    title: "হিসাববিজ্ঞান (নবম-দশম শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // ===================== CLASS 11 & 12 (Higher Secondary / HSC) =====================
  {
    id: "c11-bangla",
    grade: "Class 11",
    subject: "Bangla",
    title: "সাহিত্যপাঠ ও সহপাঠ (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c11-english",
    grade: "Class 11",
    subject: "English",
    title: "English for Today (Classes 11-12)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c11-ict",
    grade: "Class 11",
    subject: "ICT",
    title: "তথ্য ও যোগাযোগ প্রযুক্তি (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c11-physics-1",
    grade: "Class 11",
    subject: "Physics",
    title: "পদার্থবিজ্ঞান ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1P1yS2iC7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-physics-2",
    grade: "Class 11",
    subject: "Physics",
    title: "পদার্থবিজ্ঞান ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1P1yS2iC7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-chem-1",
    grade: "Class 11",
    subject: "Chemistry",
    title: "রসায়ন ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1hE2mI7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-chem-2",
    grade: "Class 11",
    subject: "Chemistry",
    title: "রসায়ন ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1hE2mI7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-bio-1",
    grade: "Class 11",
    subject: "Biology",
    title: "জীববিজ্ঞান ১ম পত্র - উদ্ভিদবিজ্ঞান (একাদশ-দ্বাদশ)",
    driveUrl: "https://drive.google.com/file/d/1B1iO2lO7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-bio-2",
    grade: "Class 11",
    subject: "Biology",
    title: "জীববিজ্ঞান ২য় পত্র - প্রাণিবিজ্ঞান (একাদশ-দ্বাদশ)",
    driveUrl: "https://drive.google.com/file/d/1B1iO2lO7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c11-math-1",
    grade: "Class 11",
    subject: "Higher Mathematics",
    title: "উচ্চতর গণিত ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c11-math-2",
    grade: "Class 11",
    subject: "Higher Mathematics",
    title: "উচ্চতর গণিত ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c11-accounting-1",
    grade: "Class 11",
    subject: "Accounting",
    title: "হিসাববিজ্ঞান ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c11-accounting-2",
    grade: "Class 11",
    subject: "Accounting",
    title: "হিসাববিজ্ঞান ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c11-economics-1",
    grade: "Class 11",
    subject: "Economics",
    title: "অর্থনীতি ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1E1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
  {
    id: "c11-civics-1",
    grade: "Class 11",
    subject: "Civics & Good Governance",
    title: "পৌরনীতি ও সুশাসন ১ম পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },

  // Class 12 duplicates pointing to Class 11-12 collection
  {
    id: "c12-bangla",
    grade: "Class 12",
    subject: "Bangla",
    title: "সাহিত্যপাঠ ও সহপাঠ (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1U42E259t9i4_e2rTq1nLh52Q1tX9d5-E/preview",
  },
  {
    id: "c12-english",
    grade: "Class 12",
    subject: "English",
    title: "English for Today (Classes 11-12)",
    driveUrl: "https://drive.google.com/file/d/1G7nN2QyR_1wG6P4gK3tM8u9v8c_d2w1L/preview",
  },
  {
    id: "c12-ict",
    grade: "Class 12",
    subject: "ICT",
    title: "তথ্য ও যোগাযোগ প্রযুক্তি (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1D9tE5yU2i7oP1qK3gM9tN0w4c_b5v1M/preview",
  },
  {
    id: "c12-physics-2",
    grade: "Class 12",
    subject: "Physics",
    title: "পদার্থবিজ্ঞান ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1P1yS2iC7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c12-chem-2",
    grade: "Class 12",
    subject: "Chemistry",
    title: "রসায়ন ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1C1hE2mI7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c12-bio-2",
    grade: "Class 12",
    subject: "Biology",
    title: "জীববিজ্ঞান ২য় পত্র - প্রাণিবিজ্ঞান (একাদশ-দ্বাদশ)",
    driveUrl: "https://drive.google.com/file/d/1B1iO2lO7s9uV4bX8nM1kL6tO3v9qA2w/preview",
  },
  {
    id: "c12-math-2",
    grade: "Class 12",
    subject: "Higher Mathematics",
    title: "উচ্চতর গণিত ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1B9qR3vM8t2wP4nL5gK7tM1u0v9c_d3w1/preview",
  },
  {
    id: "c12-accounting-2",
    grade: "Class 12",
    subject: "Accounting",
    title: "হিসাববিজ্ঞান ২য় পত্র (একাদশ-দ্বাদশ শ্রেণি)",
    driveUrl: "https://drive.google.com/file/d/1A1cO2uN7t5uK1pL6gM8tO2v1c_f4w2L/preview",
  },
];

/**
 * Filter books by grade (e.g. "Class 6" or "Class 9")
 */
export function getCatalogBooksByGrade(grade?: string | null): NctbBookItem[] {
  if (!grade) return NCTB_CATALOG;
  const normalized = grade.trim().toLowerCase();
  return NCTB_CATALOG.filter((b) => b.grade.toLowerCase() === normalized);
}
