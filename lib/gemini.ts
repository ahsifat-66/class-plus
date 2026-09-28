import { GoogleGenAI } from "@google/genai";

// Verified available generation models ordered by speed, capability, and quota stability
export const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-robotics-er-2-preview",
];

export function getGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
  return key.trim().length > 0 ? key.trim() : null;
}

export function createGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function generateAcademicContent(
  prompt: string,
  customModels: string[] = GEMINI_MODELS
): Promise<{ text: string; model: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API key in environment (GEMINI_API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of customModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const raw =
        typeof response.text === "function"
          ? (response.text as any)()
          : response.text || "";

      if (typeof raw === "string" && raw.trim().length > 0) {
        return { text: raw.trim(), model };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code;
      const msg = err?.message || String(err);

      // Check if transient or unsupported model error; continue to next model
      const isRecoverable =
        status === 404 ||
        status === 429 ||
        status === 500 ||
        status === 503 ||
        msg.includes("not found") ||
        msg.includes("no longer available") ||
        msg.includes("high demand") ||
        msg.includes("Resource has been exhausted") ||
        msg.includes("UNAVAILABLE");

      if (isRecoverable) {
        console.warn(`[Gemini] Model ${model} unavailable (${status}). Trying next candidate...`);
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("All candidate Gemini models failed to generate content.");
}
