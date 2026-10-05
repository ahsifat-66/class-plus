export const GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  return key.trim().length > 0 ? key.trim() : null;
}

export async function generateAcademicContent(
  prompt: string
): Promise<{ text: string; model: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const cleanKey = apiKey.replace(/['"]+/g, "").trim();
  const models = GEMINI_MODELS;

  let lastError: any = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": cleanKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}: Failed to generate`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string" && text.trim().length > 0) {
        return { text: text.trim(), model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini REST] Model ${model} failed:`, err?.message || err);
      continue;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini API.");
}

export async function generateMultimodalGeminiContent(
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  modelsToTry: string[] = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
): Promise<{ text: string; model: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const cleanKey = apiKey.replace(/['"]+/g, "").trim();
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": cleanKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}: Failed to generate`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && typeof text === "string" && text.trim().length > 0) {
        return { text: text.trim(), model };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Multimodal] Model ${model} failed:`, err?.message || err);
      continue;
    }
  }

  throw lastError || new Error("Failed to generate multimodal response from Gemini API.");
}

/**
 * Core assessment and explanation directives for Bangladesh NCTB Quiz Generation.
 * Strictly requires dynamic question-specific explanations with exact NCTB page references.
 */
export const NCTB_QUIZ_EXPLANATION_GUIDELINES = `
CRITICAL REQUIREMENT FOR 'explanation' & 'pageReference':
1. Each question MUST have a UNIQUE, dynamic explanation strictly tailored to THAT specific question's subject matter.
2. DO NOT use generic filler sentences (e.g., "পাঠ্যবই অনুযায়ী সঠিক", "একাডেমিক যুক্তির ভিত্তিতে", "বই অনুযায়ী সঠিক").
3. The explanation must clearly explain WHY the correct option is scientifically, mathematically, or factually true, and why other options are incorrect.
4. Provide the exact NCTB Chapter name and the relevant textbook page range for that specific topic (e.g. "অধ্যায় X, পৃষ্ঠা: Y-Z" or "Chapter X, Pages: Y-Z").
`.trim();

export interface NctbQuizPromptOptions {
  gradeLevel: string;
  subject: string;
  chapterName: string;
  count?: number;
  language?: "bn" | "en";
  contextText?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

/**
 * Builds the official NCTB MCQ assessment prompt with strict grade boundaries,
 * negative constraints, dynamic explanations, and page references.
 */
export function buildNctbQuizPrompt({
  gradeLevel,
  subject,
  chapterName,
  count = 5,
  language = "bn",
  contextText,
  difficulty = "Medium",
}: NctbQuizPromptOptions): string {
  const isBengali = language === "bn";
  const difficultyGuide = {
    Easy: isBengali ? "সহজ (মূল ধারণা, সংজ্ঞা ও সরাসরি বইয়ের তথ্যভিত্তিক)" : "Easy (Core concepts, definitions, direct facts)",
    Medium: isBengali ? "মাঝারি (ধারণাগত বোধগম্যতা, প্রয়োগ ও সম্পর্ক স্থাপন)" : "Medium (Conceptual understanding and application)",
    Hard: isBengali ? "কঠিন (বিশ্লেষণমূলক চিন্তা, উচ্চতর দক্ষতা)" : "Hard (Analytical and higher-order thinking)",
  }[difficulty];

  return `
Act as a veteran National Curriculum and Textbook Board (NCTB) Bangladesh examiner. 
Your task is to generate high-quality multiple-choice questions (MCQs) for:
- Target Class/Grade: ${gradeLevel} (e.g. Class 9-10)
- Subject: ${subject}
- Chapter / Topic: ${chapterName}
- Number of Questions: ${count}
- Difficulty Level: ${difficulty} (${difficultyGuide})
- Language: ${isBengali ? "100% PURE, STANDARD BENGALI (প্রমিত বাংলা)" : "100% ENGLISH (NCTB English Version)"}

[STRICT SYLLABUS BOUNDARY RULES]:
1. TARGET GRADE ONLY: You must ONLY generate questions appropriate for ${gradeLevel}. 
2. STRICT NEGATIVE CONSTRAINTS (NO OUT-OF-GRADE TOPICS):
   - If generating for Class 9-10: Strictly FORBIDDEN to include Higher Secondary (Class 11-12/HSC) or College-level topics, formulas, or advanced terminology (e.g. no calculus, no complex vectors, no organic reaction mechanisms).
   - If generating for Class 6-8: Strictly keep to fundamental concepts; do not use Class 9-10 formulas.
3. CONTEXT GROUNDING:
   ${
     contextText
       ? `Rely exclusively on the provided reference content below. Do NOT introduce external concepts:
   [REFERENCE CONTENT]:
   """
   ${contextText}
   """`
       : `Rely strictly on standard NCTB ${gradeLevel} ${subject} textbook syllabus for "${chapterName}".`
   }

[CRITICAL REQUIREMENT FOR 'explanation' & 'pageReference']:
1. Each question MUST have a UNIQUE, dynamic explanation strictly tailored to THAT specific question's subject matter.
2. DO NOT use generic filler sentences (e.g., "পাঠ্যবই অনুযায়ী সঠিক", "একাডেমিক যুক্তির ভিত্তিতে", "বই অনুযায়ী সঠিক").
3. The explanation must clearly explain WHY the correct option is scientifically, mathematically, or factually true, and why other options are incorrect.
4. Provide the exact NCTB Chapter name and the relevant textbook page range for that specific topic (e.g. "অধ্যায় X, পৃষ্ঠা: Y-Z" or "Chapter X, Pages: Y-Z").

[REQUIRED OUTPUT PER QUESTION]:
Format: Return ONLY a raw JSON array of objects. Do NOT use markdown code fences (\`\`\`json or \`\`\`), no greetings, and no trailing text.
[
  {
    "prompt": "${isBengali ? "প্রশ্নের বিষয়বস্তু এখানে লিখুন?" : "Clear question text here?"}",
    "options": [
      "${isBengali ? "অপশন ক" : "Option A"}",
      "${isBengali ? "অপশন খ" : "Option B"}",
      "${isBengali ? "অপশন গ" : "Option C"}",
      "${isBengali ? "অপশন ঘ" : "Option D"}"
    ],
    "correctAnswer": 0,
    "explanation": "${isBengali ? "২-৩ বাক্যে সঠিক উত্তরের বৈজ্ঞানিক/বাস্তবসম্মত যুক্তি এবং অন্য অপশনগুলো কেন ভুল তার পূর্ণাঙ্গ ব্যাখ্যা।" : "2-3 sentences explaining the underlying scientific/factual logic and why other options are incorrect."}",
    "pageReference": "${isBengali ? "অধ্যায় X, পৃষ্ঠা: Y-Z" : "Chapter X, Pages: Y-Z"}"
  }
]
`.trim();
}


