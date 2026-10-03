import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateAcademicContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      question,
      options = [],
      correctAnswer,
      correctOptionIndex,
      questionId,
    } = body;

    const questionText = typeof prompt === "string" && prompt.trim()
      ? prompt.trim()
      : typeof question === "string" && question.trim()
      ? question.trim()
      : "";

    if (!questionText) {
      return NextResponse.json(
        { error: "Question prompt is required." },
        { status: 400 }
      );
    }

    // Determine correct option text
    let correctOptionText = "";
    if (typeof correctAnswer === "string" && correctAnswer.trim()) {
      correctOptionText = correctAnswer.trim();
    } else {
      const idx =
        typeof correctOptionIndex === "number"
          ? correctOptionIndex
          : typeof correctAnswer === "number"
          ? correctAnswer
          : 0;
      if (Array.isArray(options) && options[idx]) {
        correctOptionText = String(options[idx]).trim();
      }
    }

    if (!correctOptionText && Array.isArray(options) && options.length > 0) {
      correctOptionText = String(options[0]).trim();
    }

    const optionsList = Array.isArray(options) && options.length > 0
      ? options.map((opt: any, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")
      : "";

    const aiPrompt = `Act as an NCTB textbook expert teacher. Given this multiple-choice question and correct answer:
Question: "${questionText}"
${optionsList ? `Options:\n${optionsList}\n` : ""}Correct Answer: "${correctOptionText}"

Task:
1. Explain in 2-3 clear Bengali sentences WHY this answer is scientifically/factually correct and what concept it tests.
2. DO NOT use generic filler sentences (e.g., "পাঠ্যবই অনুযায়ী সঠিক", "একাডেমিক যুক্তির ভিত্তিতে", "বই অনুযায়ী সঠিক"). Write an authentic, conceptual explanation.
3. Provide the relevant NCTB textbook Chapter and page number range.

Return JSON ONLY (no markdown code fences, no extra text):
{
  "explanation": "বিশদ বৈজ্ঞানিক/বাস্তবসম্মত ব্যাখ্যা...",
  "pageReference": "অধ্যায় নং, পৃষ্ঠা: X-Y"
}`;

    const { text } = await generateAcademicContent(aiPrompt);

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn("[quiz/explain] Failed to parse JSON from AI:", text);
      parsed = {
        explanation: cleaned.replace(/[{}\"\']/g, "").trim(),
        pageReference: "",
      };
    }

    const rawExplanation = typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";
    const rawPageRef = typeof parsed.pageReference === "string" ? parsed.pageReference.trim() : "";

    // Sanitize any generic filler sentences if returned
    let explanation = rawExplanation;
    if (
      explanation.includes("একাডেমিক যুক্তির ভিত্তিতে") ||
      explanation.includes("নির্বাচনটি প্রাসঙ্গিক এবং সঠিক") ||
      explanation.includes("পাঠ্যবই অনুযায়ী সঠিক উত্তর হলো অপশন")
    ) {
      explanation = "";
    }

    const pageReference = rawPageRef;

    // Optional background persistence: if questionId is provided, cache back to DB
    if (questionId && typeof questionId === "string" && explanation) {
      prisma.quizQuestion
        .update({
          where: { id: questionId },
          data: {
            explanation,
            ...(pageReference ? { pageReference } : {}),
          },
        })
        .catch((dbErr) => {
          console.warn("[quiz/explain] DB update skipped or failed:", dbErr?.message || dbErr);
        });
    }

    return NextResponse.json({
      success: true,
      explanation,
      pageReference,
    });
  } catch (error: any) {
    console.error("[quiz/explain] Error generating explanation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate explanation." },
      { status: 500 }
    );
  }
}
