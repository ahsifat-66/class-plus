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

export const nctbBooksData = {
  "9-10": {
    bn: {
      compulsory: [
        { id: "bn_lit", title: "সাহিত্য কণিকা (বাংলা ১ম পত্র)", url: "https://drive.google.com/file/d/17bH291V5txub-YCrg5ab-o2CA4MKvwD4/view?usp=drive_link", subject: "Bangla Literature" },
        { id: "bn_sp", title: "সহপাঠ (বাংলা)", url: "https://drive.google.com/file/d/12WjKZdodXSSzvkwO8_LViQpydKi3zXtw/view?usp=drive_link", subject: "Bangla Literature" },
        { id: "bn_gram", title: "বাংলা ব্যাকরণ ও নির্মিতি (বাংলা ২য় পত্র)", url: "https://drive.google.com/file/d/1leaeW1dOzPZG7rn8bc5fyiIT1TjRgJvN/view?usp=drive_link", subject: "Bangla Grammar" },
        { id: "en_eft", title: "English for Today", url: "https://drive.google.com/file/d/1EekMeoOWO4nVPdCUyvSLA4Y9uuBUONPo/view?usp=drive_link", subject: "English" },
        { id: "en_gram", title: "English Grammar and Composition", url: "https://drive.google.com/file/d/1VvKMLPUfuENVBh5lg6_CVsyrf7BegaBC/view?usp=drive_link", subject: "English Grammar" },
        { id: "math", title: "গণিত", url: "https://drive.google.com/file/d/1EKdNO1FRA7SoRafQzEVspEuGI5M1-mkg/view?usp=drive_link", subject: "Mathematics" },
        { id: "ict", title: "তথ্য ও যোগাযোগ প্রযুক্তি", url: "https://drive.google.com/file/d/1EzubZfMIWg6mbswtaQHpjjxwm-FD4KD8/view?usp=drive_link", subject: "ICT" },
        { id: "rel_is", title: "ইসলাম ও নৈতিক শিক্ষা", url: "https://drive.google.com/file/d/1rpxIsMK5B3vUihTHxcVVm4ER8nnI4VkV/view?usp=drive_link", subject: "Religion" },
        { id: "rel_hi", title: "হিন্দুধর্ম ও নৈতিক শিক্ষা", url: "https://drive.google.com/file/d/1HF1YMz5kR7zdmTgkYgUuVHMcW5HU3VOq/view?usp=drive_link", subject: "Religion" },
        { id: "rel_bu", title: "বৌদ্ধধর্ম ও নৈতিক শিক্ষা", url: "https://drive.google.com/file/d/1hqH-TNfe_az9JwofCxFEPoJ2x30QnLxD/view?usp=drive_link", subject: "Religion" },
        { id: "rel_ch", title: "খ্রিস্টধর্ম ও নৈতিক শিক্ষা", url: "https://drive.google.com/file/d/1e_CAtdOktysyJydbtGH9WkpTAqg9qmcK/view?usp=drive_link", subject: "Religion" },
      ],
      groups: {
        science: [
          { id: "phy", title: "পদার্থবিজ্ঞান", url: "https://drive.google.com/file/d/1G_y4t4fW3ZfbgbXSV2fqH4PvHiXApDyu/view?usp=drive_link", subject: "Physics" },
          { id: "chem", title: "রসায়ন", url: "https://drive.google.com/file/d/16teUgLDPKTIB8ZOp6dS59DKY-3R7w72L/view?usp=drive_link", subject: "Chemistry" },
          { id: "bio", title: "জীববিজ্ঞান", url: "https://drive.google.com/file/d/1zhk3MHn6XUbPTz48ywJcs63A01cwtnzd/view?usp=drive_link", subject: "Biology" },
          { id: "hm", title: "উচ্চতর গণিত", url: "https://drive.google.com/file/d/1o6Wf0NbCswP0NhtmZXJowvIvPaA30mVK/view?usp=drive_link", subject: "Higher Mathematics" },
          { id: "bgs", title: "বাংলাদেশ ও বিশ্বপরিচয়", url: "https://drive.google.com/file/d/1KIh7R6J_egWbfD6N-yikdbFMu2SvfG0h/view?usp=drive_link", subject: "Social Science" },
        ],
        business_studies: [
          { id: "gen_sci", title: "বিজ্ঞান (সাধারণ বিজ্ঞান)", url: "https://drive.google.com/file/d/1PMA3U1Pghs7bSAxuyWO12S4ltFerjucj/view?usp=drive_link", subject: "General Science" },
          { id: "acc", title: "হিসাববিজ্ঞান", url: "https://drive.google.com/file/d/1ys1MbQk9EW8wTOan58Rt0YPca53ZYZHP/view?usp=drive_link", subject: "Accounting" },
          { id: "bus_ent", title: "ব্যবসায় উদ্যোগ", url: "https://drive.google.com/file/d/1OoA-foSjnstGw7OJxB_dvuuF_bm9-R8i/view?usp=drive_link", subject: "Business Studies" },
          { id: "fin", title: "ফিন্যান্স ও ব্যাংকিং", url: "https://drive.google.com/file/d/1gNBkuWDJxYGTNSF9KppN4iGEAWkoIt7Y/view?usp=drive_link", subject: "Finance & Banking" },
          { id: "agri", title: "কৃষিশিক্ষা", url: "https://drive.google.com/file/d/1Pz7D9vw1z11B-OQlbDdKFva8_fwrYoY0/view?usp=drive_link", subject: "Agriculture" },
          { id: "home_sci", title: "গার্হস্থ্য বিজ্ঞান", url: "https://drive.google.com/file/d/1HSEx5MnCfB-a6DCeN_RcK0XevcETAa5t/view?usp=drive_link", subject: "Home Science" },
        ],
        humanities: [
          { id: "gen_sci_hum", title: "বিজ্ঞান (সাধারণ বিজ্ঞান)", url: "https://drive.google.com/file/d/1PMA3U1Pghs7bSAxuyWO12S4ltFerjucj/view?usp=drive_link", subject: "General Science" },
          { id: "hist", title: "বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা", url: "https://drive.google.com/file/d/1k1hmA3SfczWmLsJR-QQT8QybAFGkaY4B/view?usp=drive_link", subject: "History" },
          { id: "geo", title: "ভূগোল ও পরিবেশ", url: "https://drive.google.com/file/d/1xBYA6YBstbArM8uAwRSlsiuW8QqMTYRL/view?usp=drive_link", subject: "Geography" },
          { id: "civ", title: "পৌরনীতি ও নাগরিকতা", url: "https://drive.google.com/file/d/1QdtCDgJ-kRhbm8Vm-x1JIyQsfCQdvY8q/view?usp=drive_link", subject: "Civics & Citizenship" },
          { id: "econ", title: "অর্থনীতি", url: "https://drive.google.com/file/d/1NVIjVD7hmOM1ZRkhTcOYnUrAqbTWjWH0/view?usp=drive_link", subject: "Economics" },
          { id: "agri_hum", title: "কৃষিশিক্ষা", url: "https://drive.google.com/file/d/1Pz7D9vw1z11B-OQlbDdKFva8_fwrYoY0/view?usp=drive_link", subject: "Agriculture" },
          { id: "home_sci_hum", title: "গার্হস্থ্য বিজ্ঞান", url: "https://drive.google.com/file/d/1HSEx5MnCfB-a6DCeN_RcK0XevcETAa5t/view?usp=drive_link", subject: "Home Science" },
        ],
      },
    },
    en: {
      compulsory: [
        { id: "ev_bn_sp", title: "সহপাঠ (বাংলা)", url: "https://drive.google.com/file/d/12WjKZdodXSSzvkwO8_LViQpydKi3zXtw/view?usp=drive_link", subject: "Bangla Literature" },
        { id: "ev_bn_lit", title: "সাহিত্য কণিকা (বাংলা ১ম পত্র)", url: "https://drive.google.com/file/d/17bH291V5txub-YCrg5ab-o2CA4MKvwD4/view?usp=drive_link", subject: "Bangla Literature" },
        { id: "ev_bn_gram", title: "বাংলা ব্যাকরণ ও নির্মিতি (বাংলা ২য় পত্র)", url: "https://drive.google.com/file/d/1leaeW1dOzPZG7rn8bc5fyiIT1TjRgJvN/view?usp=drive_link", subject: "Bangla Grammar" },
        { id: "ev_eft", title: "English for Today", url: "https://drive.google.com/file/d/1EekMeoOWO4nVPdCUyvSLA4Y9uuBUONPo/view?usp=drive_link", subject: "English" },
        { id: "ev_egc", title: "English Grammar and Composition", url: "https://drive.google.com/file/d/1VvKMLPUfuENVBh5lg6_CVsyrf7BegaBC/view?usp=drive_link", subject: "English Grammar" },
        { id: "ev_math", title: "Mathematics", url: "https://drive.google.com/file/d/1gnGOvkg1YQ_NmI7Uq3wSteyUL5uyi7mr/view?usp=drive_link", subject: "Mathematics" },
        { id: "ev_ict", title: "Information and Communication Technology (ICT)", url: "https://drive.google.com/file/d/1l82JAI2GL8zzAG1PzBdvRJvq8ouhxq9U/view?usp=drive_link", subject: "ICT" },
        { id: "ev_rel_is", title: "Islamic Studies", url: "https://drive.google.com/file/d/1A0sMU8V9RVo1RrWvQmTKi2NpGdIDShLx/view?usp=drive_link", subject: "Religion" },
        { id: "ev_rel_hi", title: "Hindu Religion Studies", url: "https://drive.google.com/file/d/1nkLQDVtDXUuZOFGTL7GdjptO1-x8VaB2/view?usp=drive_link", subject: "Religion" },
        { id: "ev_rel_bu", title: "Buddhist Religion Studies", url: "https://drive.google.com/file/d/1ODnkP6EnJ0LfS1P1JFArJAPnIJF8hAM9/view?usp=drive_link", subject: "Religion" },
        { id: "ev_rel_ch", title: "Christian Religion Studies", url: "https://drive.google.com/file/d/1A3pAB8mQnl9G_2fkEzhKwMBiVaseaTK3/view?usp=drive_link", subject: "Religion" },
      ],
      groups: {
        science: [
          { id: "ev_phy", title: "Physics", url: "https://drive.google.com/file/d/17e_4XkWY7HIfhAG5lZ0WZYmhGnTH1-dh/view?usp=drive_link", subject: "Physics" },
          { id: "ev_chem", title: "Chemistry", url: "https://drive.google.com/file/d/1D1S9VZnFHrziRihX_eabVpBVBDYhvbgm/view?usp=drive_link", subject: "Chemistry" },
          { id: "ev_bio", title: "Biology", url: "https://drive.google.com/file/d/1zi9vIj2SzIOlnBubLWZZ_lkCJe-RkAkl/view?usp=drive_link", subject: "Biology" },
          { id: "ev_hm", title: "Higher Mathematics", url: "https://drive.google.com/file/d/1h058NC7pQV5fwcvBZyuNnpQKrbWWvi9s/view?usp=drive_link", subject: "Higher Mathematics" },
          { id: "ev_bgs", title: "Bangladesh and Global Studies", url: "https://drive.google.com/file/d/1cfZNMCc8wlllEdOxHz7Wv0kjAc9vGXg6/view?usp=drive_link", subject: "Social Science" },
        ],
        business_studies: [
          { id: "ev_acc", title: "Accounting", url: "https://drive.google.com/file/d/1efjhwLg-7w8JRgzyDmwLP-U5NGrozTb6/view?usp=drive_link", subject: "Accounting" },
          { id: "ev_fin", title: "Finance and Banking", url: "https://drive.google.com/file/d/1KkA9wIGoxWtB--0eGBO0hblmZnzd1uvn/view?usp=drive_link", subject: "Finance & Banking" },
          { id: "ev_bus_ent", title: "Business Entrepreneurship", url: "https://drive.google.com/file/d/1T5ODXubjX1jRVSrlaJCxz_nLMiFKkiBI/view?usp=drive_link", subject: "Business Studies" },
          { id: "ev_sci", title: "Science", url: "https://drive.google.com/file/d/1KjIwpUWuymJ_OEsIx_JHpBEyGQsMjPQu/view?usp=drive_link", subject: "General Science" },
          { id: "ev_agri", title: "Agricultural Studies", url: "https://drive.google.com/file/d/1ICiZ1n70kQc-TUHobmIBuy3S3yv1_N9U/view?usp=drive_link", subject: "Agriculture" },
          { id: "ev_home_sci", title: "Home Science", url: "https://drive.google.com/file/d/1ZWD3CSzF-ACPb1EwUJ-_mdBLZgsAKaz8/view?usp=drive_link", subject: "Home Science" },
        ],
        humanities: [
          { id: "ev_hist", title: "History of Bangladesh and World Civilization", url: "https://drive.google.com/file/d/1amB4r1NWnmdVvykMrqZZNwpL76SBbtKS/view?usp=drive_link", subject: "History" },
          { id: "ev_geo", title: "Geography and Environment", url: "https://drive.google.com/file/d/1uuSOxc_NAXCktaPL0XvHpVQXnHfzTQ5S/view?usp=drive_link", subject: "Geography" },
          { id: "ev_civ", title: "Civics and Citizenship", url: "https://drive.google.com/file/d/115loKKAJJJ6-0nM4TbG39Ve_lkg-Ayls/view?usp=drive_link", subject: "Civics & Citizenship" },
          { id: "ev_econ", title: "Economics", url: "https://drive.google.com/file/d/1oPO08fyz5CBXcASsKpo779xN7yLN9SKw/view?usp=drive_link", subject: "Economics" },
          { id: "ev_sci_hum", title: "Science", url: "https://drive.google.com/file/d/1KjIwpUWuymJ_OEsIx_JHpBEyGQsMjPQu/view?usp=drive_link", subject: "General Science" },
          { id: "ev_agri_hum", title: "Agricultural Studies", url: "https://drive.google.com/file/d/1ICiZ1n70kQc-TUHobmIBuy3S3yv1_N9U/view?usp=drive_link", subject: "Agriculture" },
          { id: "ev_home_sci_hum", title: "Home Science", url: "https://drive.google.com/file/d/1ZWD3CSzF-ACPb1EwUJ-_mdBLZgsAKaz8/view?usp=drive_link", subject: "Home Science" },
        ],
      },
    },
  },
  "11-12": {
    bn: { compulsory: [], groups: { science: [], business_studies: [], humanities: [] } },
    en: { compulsory: [], groups: { science: [], business_studies: [], humanities: [] } },
  },
};

/**
 * Convert all textbooks in textbooksData and nctbBooksData into standard Book[] items
 */
export function getGrade9To10FlatBooks(): Book[] {
  const results: Book[] = [];
  const addedIds = new Set<string>();

  // 1. TextbooksData Compulsory
  const c910 = textbooksData["9-10"];
  if (c910) {
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

    // 2. TextbooksData Groups
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
  }

  // 3. NCTB Books Data Bangla
  const n910Bn = nctbBooksData["9-10"]?.bn;
  if (n910Bn) {
    for (const item of n910Bn.compulsory) {
      if (item.id && !addedIds.has(item.id)) {
        addedIds.add(item.id);
        results.push({
          id: item.id,
          title: item.title,
          subject: item.subject || "General",
          driveUrl: item.url,
          version: "bangla",
          grade: "Class 9-10",
        });
      }
    }
    for (const gKey of ["science", "business_studies", "humanities"] as const) {
      const gBooks = n910Bn.groups[gKey] || [];
      for (const item of gBooks) {
        if (item.id && !addedIds.has(item.id)) {
          addedIds.add(item.id);
          results.push({
            id: item.id,
            title: item.title,
            subject: item.subject || (gKey === "science" ? "Science" : gKey === "business_studies" ? "Business Studies" : "Humanities"),
            driveUrl: item.url,
            version: "bangla",
            grade: "Class 9-10",
          });
        }
      }
    }
  }

  // 4. NCTB Books Data English
  const n910En = nctbBooksData["9-10"]?.en;
  if (n910En) {
    for (const item of n910En.compulsory) {
      if (item.id && !addedIds.has(item.id)) {
        addedIds.add(item.id);
        results.push({
          id: item.id,
          title: item.title,
          subject: item.subject || "General",
          driveUrl: item.url,
          version: "english",
          grade: "Class 9-10",
        });
      }
    }
    for (const gKey of ["science", "business_studies", "humanities"] as const) {
      const gBooks = n910En.groups[gKey] || [];
      for (const item of gBooks) {
        if (item.id && !addedIds.has(item.id)) {
          addedIds.add(item.id);
          results.push({
            id: item.id,
            title: item.title,
            subject: item.subject || (gKey === "science" ? "Science" : gKey === "business_studies" ? "Business Studies" : "Humanities"),
            driveUrl: item.url,
            version: "english",
            grade: "Class 9-10",
          });
        }
      }
    }
  }

  return results;
}
