import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

function generateFallbackQuiz(content: string, title?: string) {
  const sentences = content
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const topic = title || "the subject matter";

  return [
    {
      question: sentences[0]
        ? `According to the note on "${topic}", which of the following best reflects the core premise: "${sentences[0].slice(0, 80)}..."?`
        : `What is the primary objective or foundational concept of ${topic}?`,
      options: [
        sentences[0] ? sentences[0].slice(0, 70) : "It establishes the core architectural or conceptual framework.",
        "It contradicts standard foundational principles in modern analysis.",
        "It is only relevant when dealing with legacy single-threaded architectures.",
        "It acts solely as an auxiliary parameter with no bearing on results.",
      ],
      correctAnswer: 0,
      explanation: "This statement is directly highlighted as a key premise in your personal study notes.",
    },
    {
      question: sentences[1]
        ? `In reference to "${sentences[1].slice(0, 60)}...", why is this distinction critical?`
        : `Why is understanding ${topic} essential for exam and problem-solving readiness?`,
      options: [
        "It eliminates all need for verification or secondary validation.",
        sentences[1] ? sentences[1].slice(0, 70) : "It provides rigorous consistency and simplifies downstream workflows.",
        "It is purely optional and ignored in standard evaluations.",
        "It automatically reverses previous state transitions.",
      ],
      correctAnswer: 1,
      explanation: "Understanding this relationship ensures proper conceptual clarity and problem-solving application.",
    },
    {
      question: sentences[2]
        ? `How does the note suggest addressing "${sentences[2].slice(0, 60)}..."?`
        : `Which practice is emphasized for mastering ${topic}?`,
      options: [
        "By bypassing edge case analysis in production workloads.",
        "By avoiding systematic logging or metric tracking.",
        sentences[2] ? sentences[2].slice(0, 70) : "By adhering strictly to structured principles and verified heuristics.",
        "By delaying review until final comprehensive assessments.",
      ],
      correctAnswer: 2,
      explanation: "Your notes explicitly indicate this systematic approach for reliable results.",
    },
  ];
}

function generateFallbackSummary(content: string, title?: string) {
  const lines = content
    .split(/[\n.]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const takeaways =
    lines.length > 0
      ? lines.slice(0, 5).map((line) => line)
      : [
          `Core focus centered around ${title || "the selected subject"}.`,
          "Emphasizes understanding underlying structural mechanics over rote memorization.",
          "Key formula and syntax references should be practiced regularly.",
        ];

  const flashcards = lines.slice(0, 4).map((line, idx) => ({
    front: `Concept #${idx + 1}: ${title ? `${title} - ` : ""}Key Insight`,
    back: line,
  }));

  return {
    summary: `Comprehensive overview of "${title || "Study Note"}": Covers key definitions, core relationships, and application heuristics.`,
    keyTakeaways: takeaways,
    flashcards: flashcards.length > 0 ? flashcards : [
      {
        front: title || "Core Concept",
        back: content.slice(0, 150) || "Foundational review material.",
      },
    ],
  };
}

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

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });

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

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          const rawText = response.text?.trim() || "";
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

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });

          const rawText = response.text?.trim() || "";
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
        console.warn("Live Gemini API call failed in study helper, using fallback generator:", geminiError);
      }
    }

    // High quality offline fallback generator
    if (action === "quiz") {
      const quiz = generateFallbackQuiz(noteContent, noteTitle);
      return NextResponse.json({
        success: true,
        action: "quiz",
        quiz,
        source: "study-helper-fallback",
      });
    } else {
      const summaryData = generateFallbackSummary(noteContent, noteTitle);
      return NextResponse.json({
        success: true,
        action: "summary",
        ...summaryData,
        source: "study-helper-fallback",
      });
    }
  } catch (error: any) {
    console.error("Error in AI study helper:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate study materials" },
      { status: 500 }
    );
  }
}
