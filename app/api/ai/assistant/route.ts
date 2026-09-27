import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Strip emojis completely to enforce strictly professional academic tone
function stripEmojis(text: string): string {
  if (!text) return "";
  return Array.from(text)
    .filter((char) => {
      const code = char.codePointAt(0);
      if (!code) return false;
      if (code >= 0x1f300 && code <= 0x1faff) return false;
      if (code >= 0x2600 && code <= 0x27bf) return false;
      if (code >= 0x1f600 && code <= 0x1f64f) return false;
      if (code >= 0x1f680 && code <= 0x1f6ff) return false;
      if (code >= 0x2300 && code <= 0x23ff) return false;
      if (code === 0x200d || code === 0xfe0f) return false;
      return true;
    })
    .join("")
    .trim();
}

// Student & Teacher Role-Based System Prompts
const STUDENT_SYSTEM_PROMPT =
  "You are a patient, academic Socratic Tutor for ClassPulse students. Explain concepts step-by-step using clear analogies. Do NOT solve students' homework directly; guide them with conceptual clues, guiding questions, and structured explanations. Strictly avoid emojis; use clear markdown formatting and formulas.";

const TEACHER_SYSTEM_PROMPT =
  "You are a professional Academic Faculty Assistant for ClassPulse educators. Provide structured, high-rigor pedagogical material, assignment descriptions with clear objectives, grading rubrics, or institutional announcements. Deliver clean, institutional markdown without emojis.";

// Bangladesh NCTB Curriculum Tiers
type NctbTier = "PRIMARY" | "LOWER_SECONDARY" | "SECONDARY" | "HIGHER_SECONDARY";

interface GradeDetectionResult {
  gradeNumber: number | null; // 1 to 12
  gradeLabel: string;
  tier: NctbTier;
}

const BENGALI_DIGITS: Record<string, number> = {
  "০": 0, "১": 1, "২": 2, "৩": 3, "৪": 4, "৫": 5, "৬": 6, "৭": 7, "৮": 8, "৯": 9,
};

const BENGALI_ORDINALS: Record<string, number> = {
  "১ম": 1, "প্রথম": 1,
  "২য়": 2, "দ্বিতীয়": 2,
  "৩য়": 3, "তৃতীয়": 3,
  "৪র্থ": 4, "চতুর্থ": 4,
  "৫ম": 5, "পঞ্চম": 5,
  "৬ষ্ঠ": 6, "ষষ্ঠ": 6,
  "৭ম": 7, "সপ্তম": 7,
  "৮ম": 8, "অষ্টম": 8,
  "৯ম": 9, "নবম": 9,
  "১০ম": 10, "দশম": 10,
  "১১শ": 11, "একাদশ": 11,
  "১২শ": 12, "দ্বাদশ": 12,
};

function detectNctbGradeAndTier(
  explicitGrade?: string,
  prompt?: string,
  context?: string
): GradeDetectionResult {
  const combined = `${explicitGrade || ""} ${prompt || ""} ${context || ""}`.toLowerCase();
  let gradeNum: number | null = null;

  // 1. Check explicit grade if provided
  if (explicitGrade && explicitGrade.trim()) {
    const cleanExplicit = explicitGrade.trim().toLowerCase();
    const classMatch = cleanExplicit.match(/(?:class|grade)\s*(\d{1,2})/i);
    if (classMatch) {
      const n = parseInt(classMatch[1], 10);
      if (n >= 1 && n <= 12) gradeNum = n;
    } else if (cleanExplicit.includes("ssc") || cleanExplicit.includes("matric")) {
      gradeNum = 10;
    } else if (cleanExplicit.includes("hsc") || cleanExplicit.includes("college")) {
      gradeNum = 12;
    } else if (cleanExplicit.includes("primary") || cleanExplicit.includes("প্রাথমিক")) {
      gradeNum = 5;
    }
  }

  // 2. Check Bengali ordinals in combined text (e.g. "৮ম শ্রেণি", "দশম শ্রেণির")
  if (!gradeNum) {
    for (const [key, val] of Object.entries(BENGALI_ORDINALS)) {
      if (combined.includes(key)) {
        gradeNum = val;
        break;
      }
    }
  }

  // 3. Check Bengali digits (e.g. "৮ শ্রেণি", "১০ম শ্রেণি", "৭ম")
  if (!gradeNum) {
    const bengaliNumMatch = combined.match(/([১-৯]|১০|১১|১২)\s*(?:ম|য়|র্থ|ষ্ঠ|শ|তম)?\s*(?:শ্রেণি|শ্রেণী|ক্লাস)/);
    if (bengaliNumMatch) {
      const raw = bengaliNumMatch[1];
      if (raw === "১০") gradeNum = 10;
      else if (raw === "১১") gradeNum = 11;
      else if (raw === "১২") gradeNum = 12;
      else if (BENGALI_DIGITS[raw] !== undefined) gradeNum = BENGALI_DIGITS[raw];
    }
  }

  // 4. Check English patterns in combined text (e.g. "class 4", "class 11", "grade 9")
  if (!gradeNum) {
    const enMatch = combined.match(/(?:class|grade)\s*(\d{1,2})/i);
    if (enMatch) {
      const n = parseInt(enMatch[1], 10);
      if (n >= 1 && n <= 12) gradeNum = n;
    }
  }

  // 5. Keyword checks (SSC, HSC, College, Primary)
  if (!gradeNum) {
    if (
      combined.includes("hsc") ||
      combined.includes("higher secondary") ||
      combined.includes("উচ্চ মাধ্যমিক") ||
      combined.includes("college")
    ) {
      gradeNum = 12;
    } else if (
      combined.includes("ssc") ||
      combined.includes("secondary school certificate") ||
      combined.includes("দাখিল") ||
      combined.includes("মাধ্যমিক")
    ) {
      gradeNum = 10;
    }
  }

  // Tier classification:
  // Tier 1: PRIMARY (Class 1 - 5)
  // Tier 2: LOWER SECONDARY (Class 6 - 8)
  // Tier 3: SECONDARY / SSC (Class 9 - 10)
  // Tier 4: HIGHER SECONDARY / HSC (Class 11 - 12)
  let tier: NctbTier = "SECONDARY";
  let gradeLabel = "Class 8-9 (Secondary)";

  if (gradeNum !== null) {
    if (gradeNum >= 1 && gradeNum <= 5) {
      tier = "PRIMARY";
      gradeLabel = `Class ${gradeNum} (Primary)`;
    } else if (gradeNum >= 6 && gradeNum <= 8) {
      tier = "LOWER_SECONDARY";
      gradeLabel = `Class ${gradeNum} (Lower Secondary)`;
    } else if (gradeNum === 9 || gradeNum === 10) {
      tier = "SECONDARY";
      gradeLabel = `Class ${gradeNum} (Secondary / SSC)`;
    } else if (gradeNum === 11 || gradeNum === 12) {
      tier = "HIGHER_SECONDARY";
      gradeLabel = `Class ${gradeNum} (HSC / College)`;
    }
  }

  return { gradeNumber: gradeNum, gradeLabel, tier };
}

function getNctbTierSystemPrompt(tier: NctbTier, gradeLabel: string): string {
  switch (tier) {
    case "PRIMARY":
      return `BANGLADESH NCTB CURRICULUM LEVEL: ${gradeLabel} (Tier 1: Primary, Class 1-5).
Pedagogical Directives:
- Tone: Gentle, extremely simple, warm, and highly encouraging.
- Vocabulary: Use simple, everyday words. Avoid abstract or technical jargon entirely.
- Curriculum Reference: Bangladesh NCTB Primary textbooks (প্রাথমিক গণিত, প্রাথমিক বিজ্ঞান, বাংলা, English For Today, বাংলাদেশ ও বিশ্বপরিচয়, ধর্ম ও নৈতিক শিক্ষা).
- Examples: Use concrete, real-world objects relatable to primary students (e.g., ফল, খেলনা, পরিবার, পাখি, গাছপালা).
- Style: Explain one small step at a time with simple guiding questions.`;

    case "LOWER_SECONDARY":
      return `BANGLADESH NCTB CURRICULUM LEVEL: ${gradeLabel} (Tier 2: Lower Secondary, Class 6-8).
Pedagogical Directives:
- Tone: Inquisitive, activity-based, experiential, and engaging.
- Curriculum Reference: Bangladesh NCTB Lower Secondary curriculum (গণিত, বিজ্ঞান - অনুসন্ধানী ও অনুশীলন পাঠ, ইতিহাস ও সামাজিক বিজ্ঞান, ডিজিটাল প্রযুক্তি, জীবন ও জীবিকা, বাংলা, English).
- Pedagogy: Concept-driven with step-by-step logic and practical life skills. Guide students to discover concepts through inquiry and real-world experiments without direct solution spoilers.`;

    case "SECONDARY":
      return `BANGLADESH NCTB CURRICULUM LEVEL: ${gradeLabel} (Tier 3: Secondary / SSC, Class 9-10).
Pedagogical Directives:
- Tone: Structured, analytical, and SSC Board-exam focused standard.
- Curriculum Reference: Bangladesh NCTB Secondary textbooks across streams: Science (Physics, Chemistry, Biology, Higher Math), Business Studies (Accounting, Finance), Humanities, and General subjects.
- Pedagogy: Provide exact definitions, formulas, geometric theorems (উপপাদ্য/সম্পাদ্য), chemical equations, and structured problem-solving steps strictly aligned with SSC board question patterns.`;

    case "HIGHER_SECONDARY":
      return `BANGLADESH NCTB CURRICULUM LEVEL: ${gradeLabel} (Tier 4: Higher Secondary / HSC, Class 11-12 / College).
Pedagogical Directives:
- Tone: Academic, rigorous, college & university admission standard.
- Curriculum Reference: Advanced Physics, Chemistry, Biology, Higher Math, ICT, Economics, Accounting.
- Pedagogy: Provide comprehensive mathematical derivations, calculus foundations, formal scientific rigor, and deep conceptual clarity preparing students for both HSC Board exams and university entrance exams.`;

    default:
      return `BANGLADESH NCTB CURRICULUM LEVEL: ${gradeLabel}. Adhere strictly to Bangladesh NCTB textbooks and guidelines. Deliver clean, structured markdown.`;
  }
}

function getLanguageDirective(language: string, promptText: string): { directive: string; effectiveLang: "bn" | "en" } {
  const isBengaliScript = /[\u0980-\u09FF]/.test(promptText);

  if (language === "bn" || (language === "auto" && isBengaliScript)) {
    return {
      effectiveLang: "bn",
      directive:
        "Language Directive: You MUST respond strictly in clean, standard, and natural Bengali (প্রমিত বাংলা). Use official NCTB Bengali terminology (e.g., অধ্যায়, সমীকরণ, সালোকসংশ্লেষণ, ভগ্নাংশ). Even if the user asks in English or Banglish, formulate your entire response in fluent Bengali.",
    };
  }

  if (language === "en" || (language === "auto" && !isBengaliScript)) {
    return {
      effectiveLang: "en",
      directive:
        "Language Directive: You MUST respond strictly in clear, grammatically sound English. Follow the NCTB English Version textbook curriculum and standards. Avoid regional slang or complex academic jargon.",
    };
  }

  // Fallback auto
  return {
    effectiveLang: isBengaliScript ? "bn" : "en",
    directive:
      "Language Directive: Automatically match the user's language. If the query is in Bengali or Banglish, answer in fluent Bengali. If in English, answer in clear English.",
  };
}

function isGreetingOrCasual(text: string): boolean {
  const t = text.trim().toLowerCase();
  // English greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|how are you|how r u|what's up|sup|yo)\b/i.test(t)) return true;
  // Banglish greetings
  if (/^(kmn acho|kemon acho|kemon aso|kmn aso|valo acho|bhalo acho|ki obostha|ki khobor|kire|assalamu alaikum|salam)\b/i.test(t)) return true;
  // Bengali greetings
  if (/^(কেমন আছ|কেমন আছেন|কেমন আছো|হ্যালো|হাই|সালাম|আসসালামু আলাইকুম|কি খবর|শুভ সকাল|শুভ সন্ধ্যা)\b/i.test(t)) return true;
  // Short greetings
  if (t.length <= 15 && (/^(hi|hello|hey|salam|kire)$/i.test(t) || /^(হাই|হ্যালো|সালাম)$/.test(t))) return true;
  return false;
}

function getGreetingReply(text: string, isBn: boolean): string {
  const t = text.trim().toLowerCase();
  if (/kmn|kemon|valo|bhalo|obostha|khobor|আছ|আছেন|খবর/i.test(t)) {
    return isBn || /kmn|kemon|bhalo|valo/i.test(t)
      ? "Alhamdulillah, ami bhalo achi. Tomar porashona kemon cholche? Ajke kon subject porbe?"
      : "I am doing well, thank you! How are your studies going? What topic would you like to explore today?";
  }
  if (/salam|সালাম/i.test(t)) {
    return isBn || /salam/i.test(t)
      ? "Wa alaikumus salam! Tomar porashona kemon cholche? Ajke kon subject porbe?"
      : "Wa alaikumus salam! How are your studies going? What topic would you like to explore today?";
  }
  return isBn || /kmn|kemon|bhalo|valo/i.test(t)
    ? "Alhamdulillah, ami bhalo achi. Tomar porashona kemon cholche? Ajke kon subject porbe?"
    : "Hello! How are your studies going? What topic would you like to explore today?";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      context,
      mode = "explain",
      role: requestedRole,
      gradeLevel: explicitGrade,
      language: requestedLanguage = "auto",
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A valid prompt or question is required." },
        { status: 400 }
      );
    }

    // Determine authenticated user role
    const session = await getSessionUser(req);
    let resolvedRole: "STUDENT" | "TEACHER" = "STUDENT";

    if (session?.role === "TEACHER" || session?.role === "STUDENT") {
      resolvedRole = session.role;
    } else if (requestedRole === "TEACHER" || requestedRole === "STUDENT") {
      resolvedRole = requestedRole;
    } else if (
      mode === "draft_assignment" ||
      mode === "announcement" ||
      mode === "generate_quiz"
    ) {
      resolvedRole = "TEACHER";
    }

    // Detect Bangladesh NCTB Grade & Tier
    const nctbGrade = detectNctbGradeAndTier(explicitGrade, prompt, context);
    const tierPrompt = getNctbTierSystemPrompt(nctbGrade.tier, nctbGrade.gradeLabel);

    // Language directive
    const { directive: languageDirective, effectiveLang } = getLanguageDirective(
      requestedLanguage,
      prompt
    );

    const baseRolePrompt =
      resolvedRole === "TEACHER" ? TEACHER_SYSTEM_PROMPT : STUDENT_SYSTEM_PROMPT;

    const casualGreetingDirective = `
CASUAL GREETINGS & SMALL TALK:
When a student asks casual or greeting questions (e.g., 'Kmn acho?' or 'Hi' or 'কেমন আছো?' or 'Assalamu alaikum'), reply naturally, politely, and warmly in fluent Bengali or English (e.g., 'Alhamdulillah, ami bhalo achi. Tomar porashona kemon cholche? Ajke kon subject porbe?' / 'Hello! I am doing well, thank you. How are your studies going? What topic would you like to explore today?'). Never treat friendly greetings as homework problems.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

        let promptInstruction = `${baseRolePrompt}

${tierPrompt}

${languageDirective}

${casualGreetingDirective}

User Role: ${resolvedRole}
Target Grade: ${nctbGrade.gradeLabel} (Tier: ${nctbGrade.tier})
Response Language: ${effectiveLang === "bn" ? "Bengali" : "English"}
Mode: ${mode}
${context ? `Reference Context: """\n${context}\n"""` : ""}

User Prompt / Instruction:
"${prompt.trim()}"`;

        if (mode === "draft_assignment") {
          promptInstruction += `

TASK REQUIREMENT:
You must output a structured assignment draft in JSON format with exactly three fields:
{
  "title": "Concise academic assignment title without emojis",
  "description": "Comprehensive markdown description containing: 1. Overview, 2. Learning Objectives, 3. Core Requirements / Problem Specs, 4. Detailed Institutional Grading Rubric.",
  "maxPoints": 100
}
Strictly output valid JSON only. Do NOT enclose in backticks or markdown fences. Avoid emojis entirely.`;
        } else if (mode === "announcement") {
          promptInstruction += `

TASK REQUIREMENT:
You must output a structured institutional announcement in JSON format with exactly two fields:
{
  "title": "Formal academic notice title without emojis",
  "content": "Professional markdown announcement body with headings, bullet items, and an Anticipated Student FAQs section."
}
Strictly output valid JSON only. Do NOT enclose in backticks or markdown fences. Avoid emojis entirely.`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptInstruction,
        });

        const rawText = response.text?.trim() || "";

        if (mode === "draft_assignment") {
          const cleaned = rawText
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (parsed.title && parsed.description) {
              return NextResponse.json({
                success: true,
                role: resolvedRole,
                mode,
                gradeLevel: nctbGrade.gradeLabel,
                tier: nctbGrade.tier,
                language: effectiveLang,
                title: stripEmojis(parsed.title),
                description: stripEmojis(parsed.description),
                maxPoints: Number(parsed.maxPoints) || 100,
                reply: stripEmojis(parsed.description),
                source: "gemini-live",
              });
            }
          } catch {
            // fallback to returning reply text if JSON parsing fails
          }
        }

        if (mode === "announcement") {
          const cleaned = rawText
            .replace(/^```json\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (parsed.title && parsed.content) {
              return NextResponse.json({
                success: true,
                role: resolvedRole,
                mode,
                gradeLevel: nctbGrade.gradeLabel,
                tier: nctbGrade.tier,
                language: effectiveLang,
                title: stripEmojis(parsed.title),
                content: stripEmojis(parsed.content),
                reply: stripEmojis(parsed.content),
                source: "gemini-live",
              });
            }
          } catch {
            // fallback if JSON parsing fails
          }
        }

        const cleanReply = stripEmojis(rawText);
        return NextResponse.json({
          success: true,
          role: resolvedRole,
          mode,
          gradeLevel: nctbGrade.gradeLabel,
          tier: nctbGrade.tier,
          language: effectiveLang,
          reply: cleanReply,
          source: "gemini-live",
        });
      } catch (geminiError: any) {
        console.warn(
          "Gemini API execution error:",
          geminiError?.message || geminiError
        );
      }
    }

    // If student asked casual greeting question and API key is missing or failed
    if (isGreetingOrCasual(prompt)) {
      const greetingReply = getGreetingReply(prompt, effectiveLang === "bn");
      return NextResponse.json({
        success: true,
        role: resolvedRole,
        mode,
        gradeLevel: nctbGrade.gradeLabel,
        tier: nctbGrade.tier,
        language: effectiveLang,
        reply: greetingReply,
        source: "greeting-fallback",
      });
    }

    // Clean offline message if API key is missing or failed - DO NOT fall back to any hardcoded CS template
    return NextResponse.json(
      {
        success: false,
        role: resolvedRole,
        mode,
        gradeLevel: nctbGrade.gradeLabel,
        tier: nctbGrade.tier,
        language: effectiveLang,
        reply: "AI tutor is temporarily offline. Please verify API configuration.",
        error: "AI tutor is temporarily offline. Please verify API configuration.",
        source: "offline-notice",
      },
      {
        headers: {
          "X-AI-Notice": "API-Offline",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in Unified AI Assistant endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error processing AI academic request." },
      { status: 500 }
    );
  }
}
