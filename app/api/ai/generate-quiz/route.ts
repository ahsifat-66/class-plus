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

Strict Language & Pedagogical Directives:
1. 100% PURE, STANDARD BENGALI (প্রমিত বাংলা): The question text and all 4 answer options MUST be written in fluent, grammatically flawless Bengali matching the official NCTB textbook terminology for ${gradeLevel}.
2. TERMINOLOGY: Strictly use official Bangladesh NCTB academic terms (e.g. সালোকসংশ্লেষণ, অভিকর্ষজ ত্বরণ, পর্যায় সারণি, সমযোজী বন্ধন, জারণ-বিজারণ, কোষ বিভাজন, পরিপাকতন্ত্র). No English terms or Banglish transliteration.
3. QUALITY: Questions must test understanding, analytical reasoning, and core curriculum concepts.
4. OPTIONS: Exactly 4 distinct, plausible choices per question (one correct, three plausible distractors).
5. CORRECT OPTION: Zero-indexed integer (0, 1, 2, or 3).
6. EXPLANATION: Provide a concise, clear NCTB curriculum textbook-aligned pedagogical explanation explaining why the correct answer is right and why it matters.
7. FORMAT: Output ONLY a raw valid JSON array. Do NOT include markdown code fences or backticks, greetings, or commentary.

JSON Array Structure:
[
  {
    "question": "প্রশ্নের বিষয়বস্তু এখানে লিখুন?",
    "options": ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"],
    "correctOptionIndex": 0,
    "points": 1,
    "explanation": "সংক্ষিপ্ত ও স্পষ্ট একাডেমিক ব্যাখ্যা (সঠিক উত্তরের যুক্তি ও মূল সূত্র)।"
  }
]`;
    } else {
      prompt = `You are an expert Bangladesh National Curriculum and Textbook Board (NCTB) English Version senior educator and assessment specialist.
Generate exactly ${count} curriculum-grade multiple-choice questions (MCQs) for the topic/chapter: "${topic.trim()}" in "${subject}", tailored for "${gradeLevel}".

Strict Language & Pedagogical Directives:
1. 100% ENGLISH (NCTB English Version): The question text and all 4 answer options MUST be written in grammatically flawless English adhering to Bangladesh NCTB English Version syllabus standards for ${gradeLevel}.
2. QUALITY: Questions must test conceptual understanding, numerical/analytical principles, and factual correctness.
3. OPTIONS: Exactly 4 distinct, plausible choices per question (one correct, three plausible distractors).
4. CORRECT OPTION: Zero-indexed integer (0, 1, 2, or 3).
5. EXPLANATION: Provide a concise, clear NCTB curriculum-aligned explanation of why this answer is correct and the underlying textbook logic.
6. FORMAT: Output ONLY a raw valid JSON array. Do NOT include markdown code fences or backticks, greetings, or commentary.

JSON Array Structure:
[
  {
    "question": "What is the primary function of chlorophyll in photosynthesis?",
    "options": ["Absorbing light energy", "Releasing nitrogen", "Fixing carbon into oxygen", "Storing lipids"],
    "correctOptionIndex": 0,
    "points": 1,
    "explanation": "Chlorophyll is a photosynthetic pigment that absorbs solar photon energy to drive light-dependent reactions in plant chloroplasts."
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
      return {
        question,
        options,
        correctOptionIndex,
        points: Number(q.points) || 1,
        explanation,
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
