import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function getSocraticFallbackResponse(question: string, history: Array<{ role: string; content: string }>) {
  const q = question.toLowerCase();

  if (q.includes("join") || q.includes("left join") || q.includes("inner join")) {
    return "Think about what happens to rows that don't have a matching pair in the other table. If a customer has never made any purchases yet, which type of JOIN guarantees they still appear in your result set?";
  }

  if (q.includes("null") || q.includes("coalesce")) {
    return "When an arithmetic operation like `price * quantity` encounters a `NULL` value, what does SQL evaluate that entire expression to? How might `COALESCE` act as a safety shield before you multiply?";
  }

  if (q.includes("group by") || q.includes("aggregate") || q.includes("sum") || q.includes("count")) {
    return "Notice that you are calculating lifetime value using `SUM()`. What columns in your `SELECT` list are NOT wrapped inside an aggregate function, and where must all of those columns be declared?";
  }

  if (q.includes("index") || q.includes("b+ tree") || q.includes("b tree")) {
    return "Consider how a B+ Tree stores its keys versus how it stores pointers to actual record rows. Why does storing all actual record pointers in leaf nodes make range scans (e.g. `BETWEEN 10 AND 50`) much faster than a standard binary search tree?";
  }

  if (q.includes("normalization") || q.includes("bcnf") || q.includes("3nf")) {
    return "What is the primary condition that defines Boyce-Codd Normal Form (BCNF) regarding functional dependencies $X \\rightarrow Y$? Specifically, what must $X$ be for every non-trivial dependency?";
  }

  if (q.includes("error") || q.includes("syntax") || q.includes("not working") || q.includes("help")) {
    return "Let's isolate the issue step-by-step. If you run only the inner `SELECT` or subquery by itself, does it return the rows and column types you expect, or does the error happen when the outer clauses execute?";
  }

  // Generic encouraging Socratic guidance
  return "That's an insightful question! Before writing the full solution, what is the core concept or constraint in the problem description that you think holds the key to the first step?";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history = [], classroomContext = "Database Systems (45-I)" } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A question is required for the tutor" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a warm, encouraging Socratic tutor in the ClassPulse educational hub for "${classroomContext}".
CRITICAL RULE: When students ask questions about assignments, homework, SQL, or code, do NOT give direct solutions or complete answers.
Always guide them by giving them exactly 1 thoughtful guiding question or 1 logical hint at a time.
Keep your response concise (2-4 sentences max).
Acknowledge their effort, point them in the right conceptual direction, and ask a guiding question to test their understanding.`;

        // Format conversation history
        const formattedHistory = history
          .slice(-6)
          .map((m: { role: string; content: string }) => `${m.role === "user" ? "Student" : "Socratic Tutor"}: ${m.content}`)
          .join("\n");

        const prompt = `${systemInstruction}

Conversation History:
${formattedHistory}

Student's Latest Question:
"${question}"

Socratic Tutor Response:`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const reply = response.text?.trim();
        if (reply) {
          return NextResponse.json({
            reply,
            source: "gemini-live",
          });
        }
      } catch (geminiError) {
        console.warn("Live Gemini API call failed in Socratic tutor; falling back to pedagogical guidance:", geminiError);
      }
    }

    const reply = getSocraticFallbackResponse(question, history);
    return NextResponse.json({
      reply,
      source: "socratic-fallback",
    });
  } catch (error) {
    console.error("Error in Socratic tutor endpoint:", error);
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 });
  }
}
