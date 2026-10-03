import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { generateAcademicContent, generateMultimodalGeminiContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url) return null;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      driveUrl,
      chapter,
      difficulty = "Medium",
      numberOfQuestions = 10,
      bookTitle = "পাঠ্যবই",
      subject = "General",
      gradeLevel = "Class 6",
    } = body;

    if (!chapter || typeof chapter !== "string" || !chapter.trim()) {
      return NextResponse.json(
        { error: "অধ্যায় বা বিষয়বস্তুর নাম উল্লেখ করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(Number(numberOfQuestions) || 10, 1), 30);
    const validDifficulty = ["Easy", "Medium", "Hard"].includes(difficulty)
      ? difficulty
      : "Medium";

    // 1. Attempt to fetch PDF stream from Google Drive
    let pdfBase64: string | null = null;
    const fileId = extractGoogleDriveFileId(driveUrl);

    if (fileId) {
      try {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

        const driveRes = await fetch(downloadUrl, {
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        clearTimeout(timeoutId);

        const contentType = driveRes.headers.get("content-type") || "";

        // If returned binary PDF and under 20MB (Gemini inlineData limit)
        if (driveRes.ok && !contentType.includes("text/html")) {
          const arrayBuffer = await driveRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 0 && buffer.length <= 20 * 1024 * 1024) {
            pdfBase64 = buffer.toString("base64");
          }
        }
      } catch (e: any) {
        console.warn(
          "[Quiz AI] Google Drive PDF download was not completed, relying on NCTB curriculum knowledge base:",
          e?.message || e
        );
      }
    }

    // 2. Build Gemini prompt
    const difficultyGuide = {
      Easy: "সহজ (মূল ধারণা, সংজ্ঞা ও সরাসরি বইয়ের তথ্যভিত্তিক)",
      Medium: "মাঝারি (ধারণাগত বোধগম্যতা, প্রয়োগ ও সম্পর্ক স্থাপন)",
      Hard: "কঠিন (বিশ্লেষণমূলক চিন্তা, বহুপদী সমাপ্তিসূচক বা উচ্চতর দক্ষতা)",
    }[validDifficulty as "Easy" | "Medium" | "Hard"];

    const prompt = `You are a senior Bangladesh National Curriculum and Textbook Board (NCTB) assessment specialist and teacher.
Generate exactly ${count} curriculum-grade Multiple-Choice Questions (MCQs) for:
- Book: "${bookTitle}"
- Subject: "${subject}"
- Chapter/Topic: "${chapter.trim()}"
- Grade: "${gradeLevel}"
- Difficulty Level: "${validDifficulty}" (${difficultyGuide})

${
  pdfBase64
    ? "IMPORTANT: Attached is the actual textbook PDF. Carefully study the content of the specified chapter/topic from this textbook and base the questions directly on the concepts, exercises, and examples found in this chapter."
    : "IMPORTANT: Use the official Bangladesh NCTB curriculum standard for this grade and subject to formulate precise, authentic textbook questions."
}

Strict Output Requirements:
1. 100% PURE, STANDARD BENGALI (প্রমিত বাংলা): All questions, 4 options, and explanations must be written in accurate Bengali matching the official NCTB textbook terminology (e.g. সালোকসংশ্লেষণ, অভিকর্ষজ ত্বরণ, সমীকরণ, লসাগু, অনুচ্ছেদ, ইত্যাদি).
2. Exactly 4 distinct choices per question. One must be undeniably correct, three must be plausible distractors.
3. answerIndex: An integer from 0 to 3 indicating the zero-indexed correct option.
4. CRITICAL REQUIREMENT FOR 'explanation' & 'pageReference':
   - Each question MUST have a UNIQUE, dynamic explanation strictly tailored to THAT specific question's subject matter.
   - DO NOT use generic filler sentences (e.g., "পাঠ্যবই অনুযায়ী সঠিক", "একাডেমিক যুক্তির ভিত্তিতে", "বই অনুযায়ী সঠিক") without actual concepts.
   - The explanation must clearly explain WHY the correct option is scientifically, mathematically, or factually true, and why other options are incorrect.
   - Provide the exact NCTB Chapter name and the relevant textbook page range for that specific topic in 'pageReference' (e.g. "অধ্যায় ৩, পৃষ্ঠা: ৪৫-৪৭").
5. Format: Return ONLY a raw JSON array of objects. Do NOT use markdown code fences (\`\`\`json or \`\`\`), no greetings, and no trailing text.

JSON Schema:
[
  {
    "question": "প্রশ্নের বিষয়বস্তু এখানে লিখুন?",
    "options": ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
    "answerIndex": 0,
    "explanation": "সঠিক উত্তরের পূর্ণাঙ্গ ব্যাখ্যা: কেন এই উত্তরটি বৈজ্ঞানিক/গাণিতিক/তথ্যগতভাবে সঠিক এবং অন্যান্য অপশন কেন ভুল তা বিস্তারিত যুক্তি।",
    "pageReference": "অধ্যায় ৩, পৃষ্ঠা: ৪৫-৪৭"
  }
]`;

    let rawText = "";

    // 3. Send request to Gemini API
    if (pdfBase64) {
      try {
        const parts: any[] = [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          { text: prompt },
        ];
        const res = await generateMultimodalGeminiContent(parts, [
          "gemini-1.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-pro",
        ]);
        rawText = res.text;
      } catch (err: any) {
        console.warn(
          "[Quiz AI] Multimodal PDF generation error, falling back to text generation:",
          err?.message || err
        );
        const textFallback = await generateAcademicContent(prompt);
        rawText = textFallback.text;
      }
    } else {
      const textFallback = await generateAcademicContent(prompt);
      rawText = textFallback.text;
    }

    // 4. Parse JSON
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }

    let parsedQuestions: any[] = [];
    try {
      parsedQuestions = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[Quiz AI] JSON Parse error:", parseErr, "Raw output:", rawText);
      return NextResponse.json(
        { error: "এআই দ্বারা প্রশ্ন তৈরিতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "কোনো প্রশ্ন তৈরি করা সম্ভব হয়নি।" },
        { status: 500 }
      );
    }

    // Normalize questions structure
    const formattedQuestions = parsedQuestions.map((q, idx) => {
      const options = Array.isArray(q.options) && q.options.length >= 4
        ? q.options.slice(0, 4).map((opt: any) => String(opt).trim())
        : ["অপশন ক", "অপশন খ", "অপশন গ", "অপশন ঘ"];

      const ansIdx =
        typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex < 4
          ? q.answerIndex
          : typeof q.correctOptionIndex === "number" && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4
          ? q.correctOptionIndex
          : 0;

      const rawExp =
        q.explanation ||
        q.rationale ||
        q.reasoning ||
        q.feedback ||
        q.solution ||
        q.details;
      const explanation = typeof rawExp === "string" ? rawExp.trim() : "";

      const rawRef =
        q.pageReference ||
        q.page_reference ||
        q.textbookReference ||
        q.reference;
      const pageReference = typeof rawRef === "string" ? rawRef.trim() : "";

      return {
        question: String(q.question || `প্রশ্ন ${idx + 1}`).trim(),
        options,
        answerIndex: ansIdx,
        correctOptionIndex: ansIdx,
        explanation,
        pageReference,
        points: 1,
      };
    });

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      chapter,
      bookTitle,
      difficulty: validDifficulty,
    });
  } catch (error: any) {
    console.error("[Quiz AI Generate] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
