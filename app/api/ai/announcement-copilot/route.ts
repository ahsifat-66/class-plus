import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function generateMockAnnouncement(notes: string, tone: string, className?: string) {
  const course = className || "Database Systems";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  let toneIntro = "";
  let toneClosing = "";
  let tag = "[ANNOUNCEMENT]";

  switch (tone.toLowerCase()) {
    case "urgent":
      tag = "[URGENT]";
      toneIntro = `> **URGENT ATTENTION REQUIRED: Immediate Course Schedule & Task Update**\n>\n> Please review these time-sensitive adjustments for **${course}** effective immediately.`;
      toneClosing = "Please make sure to set personal reminders right away. If there are severe emergency conflicts, reach out immediately via email or direct message.";
      break;
    case "supportive":
      tag = "[SUPPORTIVE]";
      toneIntro = `> **Course Advisory & Support Note**\n>\n> Hello everyone! We are entering an important milestone in **${course}**. Take a deep breath—you've been working hard, and you have all the tools needed to succeed!`;
      toneClosing = "Remember that my office hours are open, and our teaching assistants are available in the `#lab-help` channel to assist you. You've got this!";
      break;
    case "formal":
    default:
      tag = "[ACADEMIC NOTICE]";
      toneIntro = `> **Official Course Notification: Academic Update & Logistics**\n>\n> This notice provides formal instruction regarding upcoming deliverables and schedule modifications for **${course}**.`;
      toneClosing = "All students are expected to adhere strictly to the stated deadlines and academic integrity guidelines. Direct inquiries to the designated course discussion channels.";
      break;
  }

  // Parse notes into bullet highlights
  const noteLines = notes
    .split(/[\n,;.]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const bulletList =
    noteLines.length > 0
      ? noteLines.map((n) => `* **Action Item / Key Note:** ${n}`).join("\n")
      : `* **Schedule Adjustment:** Refer to updated class timeline.\n* **Preparation Material:** Review all assigned lecture readings and lab notes.\n* **Permitted Resources:** Standard authorized course materials only.`;

  const title = `${tag} ${noteLines[0] ? noteLines[0].slice(0, 45) : "Course Schedule & Requirements"}`;

  const markdownContent = `
${toneIntro}

### Summary of Announcements (${dateStr})
${bulletList}

---

### Anticipated Student FAQs
* **Q: Will the lecture or lab recording be made available?**
  * *A:* Yes, supplementary notes and references will be archived in the course channel within 24 hours of the session.
* **Q: What should I do if I experience technical difficulty or scheduling conflicts?**
  * *A:* Post immediately in the \`#lab-help\` channel or message Dr. Kamal Hossain with supporting documentation.
* **Q: Are there practice problems or review questions we can consult?**
  * *A:* Please consult the practice exercises posted under Classwork and review sample schema queries.

---
${toneClosing}
`.trim();

  return { title, content: markdownContent };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { notes, tone = "formal", className = "Database Systems (45-I)" } = body;

    if (!notes || typeof notes !== "string") {
      return NextResponse.json(
        { error: "Notes are required to draft an announcement" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are an expert academic assistant drafting an announcement for a university course.
Course: "${className}"
Selected Tone: "${tone}" (Urgent, Supportive, or Formal)
Teacher's Rough Notes:
"${notes}"

Generate a polished, professional, Markdown-formatted announcement.
Requirements:
1. Provide a concise, formal academic Title without any emojis.
2. Structure the body with clear headings, bullet points highlighting all key items from the rough notes.
3. Automatically generate an "Anticipated FAQs" section with 2-3 likely questions students would ask about these notes and concise, reassuring answers.
4. Format output strictly in JSON with two fields:
{
  "title": "...",
  "content": "..."
}
Do not include code fence backticks around the JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const text = response.text?.trim() || "";
        // Clean JSON formatting if wrapped in markdown
        const cleaned = text.replace(/^```json/i, "").replace(/```$/, "").trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.title && parsed.content) {
            return NextResponse.json({
              title: parsed.title,
              content: parsed.content,
              source: "gemini-live",
            });
          }
        } catch {
          // If JSON parse fails, fallback to structured output
        }
      } catch (geminiError) {
        console.warn("Live Gemini API call failed or rate-limited; switching to mock copilot:", geminiError);
      }
    }

    // High quality offline fallback generator
    const mockResult = generateMockAnnouncement(notes, tone, className);
    return NextResponse.json({
      title: mockResult.title,
      content: mockResult.content,
      source: "copilot-fallback",
    });
  } catch (error) {
    console.error("Error in AI announcement copilot:", error);
    return NextResponse.json({ error: "Failed to generate announcement" }, { status: 500 });
  }
}
