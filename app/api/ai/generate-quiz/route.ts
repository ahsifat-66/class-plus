import { NextRequest, NextResponse } from "next/server";
import { generateAcademicContent } from "@/lib/gemini";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      topic,
      subject = "General",
      gradeLevel = "Class 9",
      language = "bn",
      numQuestions = 5,
    } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        {
          error:
            language === "bn"
              ? "কুইজ তৈরির জন্য একটি অধ্যায় বা একাডেমিক বিষয় উল্লেখ করুন।"
              : "A valid academic chapter or topic is required to generate quiz questions.",
        },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 10);
    const isBengali = language === "bn";

    let prompt = "";
    if (isBengali) {
      prompt = `You are an expert Bangladesh National Curriculum and Textbook Board (NCTB) senior educator and assessment specialist.
Generate exactly ${count} curriculum-grade multiple-choice questions (MCQs) for the topic/chapter: "${topic.trim()}" in "${subject}", tailored for "${gradeLevel}".

Strict Language & Assessment Directives:
1. 100% PURE, STANDARD BENGALI (প্রমিত বাংলা): The question text and all 4 answer options MUST be written in fluent, grammatically flawless Bengali matching the official NCTB textbook terminology for ${gradeLevel}.
2. TERMINOLOGY: Strictly use official Bangladesh NCTB academic terms (e.g. সালোকসংশ্লেষণ, অভিকর্ষজ ত্বরণ, পর্যায় সারণি, সমযোজী বন্ধন, জারণ-বিজারণ, কোষ বিভাজন, পরিপাকতন্ত্র). No English terms or Banglish transliteration.
3. QUALITY: Questions must test understanding, analytical reasoning, and core curriculum concepts.
4. OPTIONS: Exactly 4 distinct, plausible choices per question (one correct, three plausible distractors).
5. CORRECT OPTION: Zero-indexed integer (0, 1, 2, or 3).
6. CRITICAL REQUIREMENT FOR 'explanation' & 'pageReference':
   - Each question MUST have a UNIQUE, dynamic explanation strictly tailored to THAT specific question's subject matter.
   - DO NOT use generic filler sentences (e.g., "পাঠ্যবই অনুযায়ী সঠিক", "একাডেমিক যুক্তির ভিত্তিতে", "বই অনুযায়ী সঠিক") without actual concepts.
   - The explanation must clearly explain WHY the correct option is scientifically, mathematically, or factually true, and why other options are incorrect.
   - Provide the exact NCTB Chapter name and the relevant textbook page range for that specific topic in 'pageReference' (e.g. "অধ্যায় ৩, পৃষ্ঠা: ৪৫-৪৭").
7. FORMAT: Output ONLY a raw valid JSON array. Do NOT include markdown code fences or backticks, greetings, or commentary.

JSON Array Structure:
[
  {
    "question": "প্রশ্নের বিষয়বস্তু এখানে লিখুন?",
    "options": ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
    "correctOptionIndex": 0,
    "points": 1,
    "explanation": "সঠিক উত্তরের পূর্ণাঙ্গ ব্যাখ্যা: কেন এই উত্তরটি বৈজ্ঞানিক/গাণিতিক/তথ্যগতভাবে সত্য এবং অন্যান্য অপশনগুলো কেন ভুল তা বিস্তারিত যুক্তি।",
    "pageReference": "অধ্যায় ৩, পৃষ্ঠা: ৪৫-৪৭"
  }
]`;
    } else {
      prompt = `You are an expert Bangladesh National Curriculum and Textbook Board (NCTB) English Version senior educator and assessment specialist.
Generate exactly ${count} curriculum-grade multiple-choice questions (MCQs) for the topic/chapter: "${topic.trim()}" in "${subject}", tailored for "${gradeLevel}".

Strict Language & Assessment Directives:
1. 100% ENGLISH (NCTB English Version): The question text and all 4 answer options MUST be written in grammatically flawless English adhering to Bangladesh NCTB English Version syllabus standards for ${gradeLevel}.
2. QUALITY: Questions must test conceptual understanding, numerical/analytical principles, and factual correctness.
3. OPTIONS: Exactly 4 distinct, plausible choices per question (one correct, three plausible distractors).
4. CORRECT OPTION: Zero-indexed integer (0, 1, 2, or 3).
5. CRITICAL REQUIREMENT FOR 'explanation' & 'pageReference':
   - Each question MUST have a UNIQUE, dynamic explanation strictly tailored to THAT specific question's subject matter.
   - DO NOT use generic filler sentences (e.g., "According to textbook it is correct", "Based on academic logic") without actual concepts.
   - The explanation must clearly explain WHY the correct option is scientifically, mathematically, or factually true, and why other options are incorrect.
   - Provide the exact NCTB Chapter name and the relevant textbook page range for that specific topic in 'pageReference' (e.g. "Chapter 3, Pages: 45-47").
6. FORMAT: Output ONLY a raw valid JSON array. Do NOT include markdown code fences or backticks, greetings, or commentary.

JSON Array Structure:
[
  {
    "question": "What is the primary function of chlorophyll in photosynthesis?",
    "options": ["Absorbing light energy", "Releasing nitrogen", "Fixing carbon into oxygen", "Storing lipids"],
    "correctOptionIndex": 0,
    "points": 1,
    "explanation": "Chlorophyll is a photosynthetic pigment in the thylakoid membrane that absorbs photon energy from blue and red light to excite electrons, whereas nitrogen release and lipid storage are unrelated biochemical pathways.",
    "pageReference": "Chapter 4, Pages: 52-55"
  }
]`;
    }

    const { text, model } = await generateAcademicContent(prompt);

    // Clean potential code block wraps or whitespace
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    // Find JSON array bounds
    const firstBracket = cleanedText.indexOf("[");
    const lastBracket = cleanedText.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanedText = cleanedText.substring(firstBracket, lastBracket + 1);
    }

    const questions = JSON.parse(cleanedText);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format returned by AI.");
    }

    const validatedQuestions = questions.map((q: any, idx: number) => {
      const question =
        typeof q.question === "string" && q.question.trim()
          ? q.question.trim()
          : isBengali
          ? `প্রশ্ন ${idx + 1}`
          : `Question ${idx + 1}`;
      const rawOptions = Array.isArray(q.options) ? q.options.map(String) : [];
      const options =
        rawOptions.length >= 2
          ? rawOptions.slice(0, 4)
          : ["Option A", "Option B", "Option C", "Option D"];
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
      let correctOptionIndex = Number(q.correctOptionIndex);
      if (
        isNaN(correctOptionIndex) ||
        correctOptionIndex < 0 ||
        correctOptionIndex >= options.length
      ) {
        correctOptionIndex = 0;
      }
      const rawExp =
        q.explanation ||
        q.rationale ||
        q.reasoning ||
        q.feedback ||
        q.solution ||
        q.details;
      const explanation =
        typeof rawExp === "string" && rawExp.trim() ? rawExp.trim() : "";

      const rawRef =
        q.pageReference ||
        q.page_reference ||
        q.textbookReference ||
        q.reference;
      const pageReference =
        typeof rawRef === "string" && rawRef.trim() ? rawRef.trim() : "";

      return {
        question,
        options,
        correctOptionIndex,
        points: Number(q.points) || 1,
        explanation,
        pageReference,
      };
    });

    return NextResponse.json({
      success: true,
      model,
      topic: topic.trim(),
      language,
      questions: validatedQuestions,
    });
  } catch (error: any) {
    console.error("[generate-quiz] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate quiz with Gemini AI." },
      { status: 500 }
    );
  }
}
