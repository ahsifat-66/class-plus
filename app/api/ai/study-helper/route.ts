import { NextRequest, NextResponse } from "next/server";
import { generateAcademicContent } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, noteContent, noteTitle, subject } = body;

    if (!action || (action !== "quiz" && action !== "summary")) {
      return NextResponse.json(
        { error: "Valid action ('quiz' or 'summary') is required" },
        { status: 400 }
      );
    }

    if (!noteContent || typeof noteContent !== "string" || !noteContent.trim()) {
      return NextResponse.json(
        { error: "Note content is required to generate AI study materials" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        if (action === "quiz") {
          const prompt = `You are an expert university tutor. Generate 3 to 5 high-quality multiple-choice practice questions based strictly on the following student note:

Subject: "${subject || "General"}"
Note Title: "${noteTitle || "Study Notes"}"
Note Text:
"""
${noteContent.slice(0, 4000)}
"""

Format your response strictly as a JSON array with objects in this exact structure:
[
  {
    "question": "Clear, challenging question prompt?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why Option A is correct based on the note."
  }
]
Note: "correctAnswer" MUST be the 0-based integer index (0, 1, 2, or 3) pointing to the correct option.
Do NOT enclose with Markdown codeblocks like \`\`\`json. Output raw JSON only.`;

          const { text: rawText } = await generateAcademicContent(prompt);
          const cleaned = rawText.replace(/^```json/i, "").replace(/```$/, "").trim();

          try {
            const quiz = JSON.parse(cleaned);
            if (Array.isArray(quiz) && quiz.length > 0) {
              return NextResponse.json({
                success: true,
                action: "quiz",
                quiz,
                source: "gemini-live",
              });
            }
          } catch {
            // fallback if JSON parse fails
          }
        } else if (action === "summary") {
          const prompt = `You are an expert academic tutor. Summarize the following study note into bullet-point flashcards and key takeaways:

Subject: "${subject || "General"}"
Note Title: "${noteTitle || "Study Notes"}"
Note Text:
"""
${noteContent.slice(0, 4000)}
"""

Format your response strictly as a JSON object with this exact structure:
{
  "summary": "2-3 sentence executive summary of the note.",
  "keyTakeaways": [
    "Key bullet takeaway 1",
    "Key bullet takeaway 2",
    "Key bullet takeaway 3"
  ],
  "flashcards": [
    {
      "front": "Concept or Question?",
      "back": "Clear, concise definition or answer."
    }
  ]
}
Do NOT enclose with Markdown codeblocks like \`\`\`json. Output raw JSON only.`;

          const { text: rawText } = await generateAcademicContent(prompt);
          const cleaned = rawText.replace(/^```json/i, "").replace(/```$/, "").trim();

          try {
            const summary = JSON.parse(cleaned);
            if (summary.summary && summary.keyTakeaways) {
              return NextResponse.json({
                success: true,
                action: "summary",
                ...summary,
                source: "gemini-live",
              });
            }
          } catch {
            // fallback if JSON parse fails
          }
        }
      } catch (geminiError) {
        console.warn("Live Gemini API call failed in study helper:", geminiError);
      }
    }

    // Clean offline message if API key is missing or call failed
    return NextResponse.json(
      {
        error: "AI study helper is temporarily offline. Please verify API configuration.",
        source: "offline-notice",
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("Error in AI study helper:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate study materials" },
      { status: 500 }
    );
  }
}
