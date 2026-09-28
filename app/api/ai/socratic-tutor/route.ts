import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function isGreetingOrCasual(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|how r u|what's up|sup|yo)\b/i.test(t)) return true;
  if (/^(kmn acho|kemon acho|kemon aso|kmn aso|valo acho|bhalo acho|ki obostha|ki khobor|kire|assalamu alaikum|salam)\b/i.test(t)) return true;
  if (/^(কেমন আছ|কেমন আছেন|কেমন আছো|হ্যালো|হাই|সালাম|আসসালামু আলাইকুম|কি খবর|শুভ সকাল|শুভ সন্ধ্যা)\b/i.test(t)) return true;
  if (t.length <= 15 && (/^(hi|hello|hey|salam|kire)$/i.test(t) || /^(হাই|হ্যালো|সালাম)$/.test(t))) return true;
  return false;
}

function getGreetingReply(text: string): string {
  const t = text.trim().toLowerCase();
  if (/kmn|kemon|valo|bhalo|obostha|khobor|আছ|আছেন|খবর/i.test(t)) {
    return "Alhamdulillah, ami bhalo achi. Tomar porashona kemon cholche? Ajke kon subject porbe?";
  }
  if (/salam|সালাম/i.test(t)) {
    return "Wa alaikumus salam! Tomar porashona kemon cholche? Ajke kon subject porbe?";
  }
  return "Hello! How are your studies going? What topic would you like to explore today?";
}

import { generateAcademicContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history = [], classroomContext = "ClassPulse Academic Classroom" } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "A question is required for the tutor" },
        { status: 400 }
      );
    }

    // Check for conversational greetings
    if (isGreetingOrCasual(question)) {
      return NextResponse.json({
        reply: getGreetingReply(question),
        source: "greeting-handler",
      }, { status: 200 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey || !apiKey.trim()) {
      const errorMsg = "Missing Gemini API key. Please configure GEMINI_API_KEY, GOOGLE_GENAI_API_KEY, or GOOGLE_API_KEY in your environment.";
      console.error("GEMINI_ERROR:", errorMsg);
      return NextResponse.json({
        error: errorMsg,
        reply: "Debug Error: " + errorMsg,
      }, { status: 200 });
    }

    try {
      const systemInstruction = `You are a warm, encouraging Socratic tutor in the ClassPulse educational hub for "${classroomContext}".
CRITICAL RULE: When students ask questions about assignments, homework, or concepts, do NOT give direct solutions or complete answers.
Always guide them by giving them exactly 1 thoughtful guiding question or 1 logical hint at a time.
Keep your response concise (2-4 sentences max). Strictly avoid emojis.
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

      const { text: replyText } = await generateAcademicContent(prompt);

      return NextResponse.json({
        reply: replyText,
        source: "gemini-live",
      }, { status: 200 });
    } catch (geminiError: any) {
      console.error("GEMINI_ERROR:", geminiError);
      const errorMessage = geminiError?.message || String(geminiError);
      return NextResponse.json({
        error: errorMessage,
        reply: "Debug Error: " + errorMessage,
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("GEMINI_ERROR:", error);
    const errorMessage = error?.message || String(error);
    return NextResponse.json({
      error: errorMessage,
      reply: "Debug Error: " + errorMessage,
    }, { status: 200 });
  }
}
