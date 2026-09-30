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
    const { topic, gradeLevel = "Grade 9-10", numQuestions = 5 } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "A valid academic topic is required to generate quiz questions." },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Number(numQuestions) || 5, 3), 10);

    const prompt = `You are an expert academic curriculum designer and teacher.
Generate exactly ${count} multiple-choice questions (MCQs) on the topic: "${topic.trim()}" tailored for "${gradeLevel}".

Strict formatting instructions:
1. Provide exactly 4 distinct and plausible options per question.
2. Provide the zero-indexed integer for the correct option (0, 1, 2, or 3).
3. Set points to 1 for each question.
4. Output ONLY a raw valid JSON array. Do NOT include markdown code fences (\`\`\`json or \`\`\`), greetings, or commentary.

JSON Array Structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "points": 1
  }
]`;

    const { text, model } = await generateAcademicContent(prompt);

    // Clean potential code block wraps or whitespace
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
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
      const question = typeof q.question === "string" ? q.question.trim() : `Question ${idx + 1}`;
      const rawOptions = Array.isArray(q.options) ? q.options.map(String) : [];
      const options = rawOptions.length >= 2 ? rawOptions.slice(0, 4) : ["Option A", "Option B", "Option C", "Option D"];
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
      let correctOptionIndex = Number(q.correctOptionIndex);
      if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
        correctOptionIndex = 0;
      }
      return {
        question,
        options,
        correctOptionIndex,
        points: Number(q.points) || 1,
      };
    });

    return NextResponse.json({
      success: true,
      model,
      topic: topic.trim(),
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
