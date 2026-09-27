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

// Intelligent fallback generator when GEMINI_API_KEY is absent or API limit reached
function generateAcademicFallback(
  role: "STUDENT" | "TEACHER",
  mode: string,
  prompt: string,
  context?: string
) {
  const p = prompt.trim();
  const topic = p.length > 0 ? p : "the selected academic topic";
  const courseContext = context ? ` (${context})` : "";

  if (role === "TEACHER") {
    if (mode === "draft_assignment") {
      const cleanTopic = topic.replace(/^assignment\s*on\s*/i, "").replace(/^draft\s*/i, "");
      const title = `Assignment: ${cleanTopic.slice(0, 50)}`;
      const description = `### Course Context & Overview${courseContext}
This assignment provides comprehensive academic assessment for **${cleanTopic}**. Students are expected to demonstrate theoretical mastery, systematic analysis, and verified problem-solving accuracy.

---

### Learning Objectives
* **Conceptual Comprehension**: Formulate and explain foundational definitions, theorems, and structural mechanics of ${cleanTopic}.
* **Practical Application**: Implement and verify algorithms, schemas, or problem sets under specified constraints.
* **Analytical Rigor**: Evaluate edge cases, computational efficiency, and trade-offs in real-world scenarios.

---

### Deliverables & Submission Requirements
1. **Annotated Written Work**: Complete all mathematical derivations and theoretical explanations in structured markdown or PDF format.
2. **Implementation / Computational Models**: Provide fully executable scripts or queries with unit tests demonstrating correctness.
3. **Synthesis Report**: Include a short discussion documenting assumptions, methodology, and performance benchmarks.

---

### Institutional Grading Rubric
* **Theoretical Rigor & Correctness (40%)**: Accurate application of core theorems, proofs, and principles.
* **Implementation & Verification (30%)**: Executable deliverables meet all functional criteria without syntax or runtime regressions.
* **Edge Case & Constraint Analysis (20%)**: Exhaustive review of boundary conditions and stability constraints.
* **Documentation & Academic Integrity (10%)**: Professional formatting, citations of authorized course references, and clear presentation.`;

      return {
        reply: description,
        title,
        description,
        maxPoints: 100,
      };
    }

    if (mode === "announcement") {
      const title = `[ACADEMIC NOTICE] ${topic.slice(0, 45)}`;
      const content = `> **Institutional Course Advisory${courseContext}**
>
> This notice provides formal instructions regarding course updates, deliverables, and upcoming milestones.

### Summary of Updates
* **Core Subject**: ${topic}
* **Timeline & Expectations**: Please review all assigned readings and problem sets ahead of scheduled sessions.
* **Office Hours & Support**: Teaching assistants are available during designated office hours to assist with clarification questions.

---

### Anticipated Student FAQs
* **Q: Where can I find reference materials and lecture notes?**
  * *A:* Primary lecture notes and supplementary readings are archived in the course repository.
* **Q: What is the policy regarding deadline extensions?**
  * *A:* Extensions require formal advance notification accompanied by relevant academic documentation.
* **Q: Are collaborative study groups permitted for this deliverable?**
  * *A:* Conceptual discussions are encouraged; however, all submitted work must be individual and comply with the institutional Honor Code.`;

      return {
        reply: content,
        title,
        content,
      };
    }

    // Default teacher material / quiz generator
    const reply = `### Academic Curriculum Blueprint: ${topic}

#### 1. Core Foundational Concepts
* **Definition & Scope**: Systematic formulation of ${topic}.
* **Key Analytical Models**: Standard mathematical definitions and formal properties.

#### 2. Socratic Discussion Questions for Lecture
1. How does the primary constraint of ${topic} influence systemic performance under heavy load?
2. What are the key distinctions between standard implementations versus specialized heuristics?
3. If boundary parameters are altered by a factor of 10, how does the complexity class adapt?

#### 3. Formative Assessment Questions
* **Question 1**: Explain the primary trade-off inherent in ${topic} using a formal invariant.
* **Question 2**: Provide a counterexample illustrating why naive assumptions fail without proper precondition verification.`;

    return { reply };
  }

  // STUDENT Role Fallbacks
  if (mode === "quiz") {
    const reply = `### Practice Self-Assessment: ${topic}

Review each question carefully and test your recall before checking the conceptual explanations.

---

#### Question 1
**In the study of ${topic}, what is the principal purpose of enforcing formal structural constraints?**
* **A)** To eliminate the need for secondary verification tests.
* **B)** To guarantee deterministic consistency and prevent invalid state transitions.
* **C)** To bypass algorithmic complexity limits in physical hardware.
* **D)** To ensure backward compatibility with deprecated single-threaded systems.

*Guiding Clue: Think about what guarantees an invariant provides throughout each iteration of an algorithm.*

---

#### Question 2
**When analyzing the time or memory complexity of ${topic}, which condition represents the typical bottleneck?**
* **A)** Sequential read access on pre-indexed memory blocks.
* **B)** Unbalanced branch factors or unindexed lookups across large sets.
* **C)** Register allocation in modern multi-core processors.
* **D)** Constant-factor arithmetic additions.

*Guiding Clue: Recall how tree depth or table traversal scales when no indexing mechanism is available.*

---

#### Reflection Prompt
What question above felt most uncertain? Formulate your reasoning and ask for a targeted clue!`;

    return { reply };
  }

  if (mode === "hint") {
    const reply = `### Conceptual Hint & Formula Synthesis: ${topic}

#### 1. Foundational Clue
When tackling problems involving ${topic}, break the problem into two distinct stages:
1. **The Invariant Condition**: What property must remain strictly true before and after each transformation?
2. **The Terminal State**: What exact condition signals that the algorithm or calculation is finished?

#### 2. Key Mathematical / Logical Relationships
* **Conservation / Equilibrium**: Ensure all inputs and outputs balance across boundaries.
* **Worst-Case Bound**: $O(f(n))$ depends directly on the most nested operations, not peripheral setup code.

#### 3. Socratic Guiding Question
Before writing out your complete proof or code, can you identify the single edge case where the default logic could produce a \`NULL\`, zero division, or cycle?`;

    return { reply };
  }

  // Default mode: "explain"
  const reply = `### Conceptual Walkthrough: ${topic}

Let's examine **${topic}** step-by-step from first principles.

#### 1. The Core Analogy
Imagine you are organizing a specialized reference library. Rather than searching through thousands of books one by one, you maintain an index directory where every entry points directly to a catalog shelf. 

In the same way, ${topic} serves as a structured bridge between raw data operations and predictable, efficient outcomes.

#### 2. Step-by-Step Breakdown
1. **Initialization**: We establish initial conditions and identify all known constraints.
2. **Transformation**: The system evaluates each parameter against established rules.
3. **Verification**: We verify whether the output adheres to expected invariants without introducing side effects.

#### 3. Guiding Socratic Question
Now that you see the high-level framework:
*How would you explain the difference between the primary goal of this concept and its nearest alternative in your own words?*

Tell me your thoughts, and we will refine the logic together!`;

  return { reply };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      context,
      mode = "explain",
      role: requestedRole,
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

    const systemPrompt =
      resolvedRole === "TEACHER" ? TEACHER_SYSTEM_PROMPT : STUDENT_SYSTEM_PROMPT;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

        let promptInstruction = `${systemPrompt}

User Role: ${resolvedRole}
Mode: ${mode}
${context ? `Reference Context: """\n${context}\n"""` : ""}

User Prompt / Instruction:
"${prompt.trim()}"`;

        if (mode === "draft_assignment") {
          promptInstruction += `

TASK REQUIREMENT:
You must output a structured assignment draft in JSON format with exactly three fields:
{
  "title": "Concise, academic assignment title without emojis",
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
          reply: cleanReply,
          source: "gemini-live",
        });
      } catch (geminiError: any) {
        console.warn(
          "Gemini API execution error; serving intelligent academic fallback:",
          geminiError?.message || geminiError
        );
      }
    }

    // Intelligent pedagogical fallback when API key is missing or calls are throttled
    const fallbackData = generateAcademicFallback(
      resolvedRole,
      mode,
      prompt,
      context
    );

    return NextResponse.json(
      {
        success: true,
        role: resolvedRole,
        mode,
        ...fallbackData,
        source: "academic-fallback",
        notice:
          "GEMINI_API_KEY is not configured or rate-limited. Serving intelligent academic fallback response.",
      },
      {
        headers: {
          "X-AI-Notice": "Fallback-Model-Active",
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
