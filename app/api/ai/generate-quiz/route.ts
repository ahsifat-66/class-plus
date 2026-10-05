import { NextRequest, NextResponse } from "next/server";
import { generateAcademicContent, buildNctbQuizPrompt } from "@/lib/gemini";
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

    const prompt = buildNctbQuizPrompt({
      gradeLevel: String(gradeLevel || "Class 9-10"),
      subject: String(subject || "General"),
      chapterName: topic.trim(),
      count,
      language: isBengali ? "bn" : "en",
    });

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
      const rawPrompt = q.prompt || q.question;
      const question =
        typeof rawPrompt === "string" && rawPrompt.trim()
          ? rawPrompt.trim()
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
      const rawAns =
        q.correctAnswer !== undefined
          ? q.correctAnswer
          : q.correctOptionIndex !== undefined
          ? q.correctOptionIndex
          : q.answerIndex;
      let correctOptionIndex = Number(rawAns);
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
      let explanation =
        typeof rawExp === "string" && rawExp.trim() ? rawExp.trim() : "";
      if (
        explanation.includes("একাডেমিক যুক্তির ভিত্তিতে") ||
        explanation.includes("নির্বাচনটি প্রাসঙ্গিক এবং সঠিক") ||
        explanation.includes("পাঠ্যবই অনুযায়ী সঠিক উত্তর হলো অপশন")
      ) {
        explanation = "";
      }

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
