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
