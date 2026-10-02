import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createFeedback } from "@/lib/feedback/store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, message, userId, userName, userEmail, uniqueId, userRole } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আপনার মূল্যবান মতামত বা সমস্যার বিবরণ লিখুন।" },
        { status: 400 }
      );
    }

    const validCategories = ["suggestion", "bug", "general"];
    const normalizedCategory = validCategories.includes(category) ? category : "general";

    // Attempt to recover session user if info missing
    const session = await getSessionUser(req);
    let effectiveUserId = userId || session?.id || "guest";
    let effectiveUserName = userName || session?.name || "Anonymous User";
    let effectiveUserEmail = userEmail || session?.email || "N/A";
    let effectiveUserRole = userRole || session?.role || "student";
    let effectiveUniqueId = uniqueId || "N/A";

    if (session?.id && (!userEmail || !uniqueId)) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.id },
          select: { email: true, name: true, role: true, uniqueId: true },
        });
        if (dbUser) {
          effectiveUserEmail = effectiveUserEmail || dbUser.email || "N/A";
          effectiveUserName = effectiveUserName || dbUser.name || "Anonymous User";
          effectiveUserRole = effectiveUserRole || dbUser.role || "student";
          effectiveUniqueId = effectiveUniqueId === "N/A" ? dbUser.uniqueId || "N/A" : effectiveUniqueId;
        }
      } catch (err) {
        // ignore
      }
    }

    const feedback = await createFeedback({
      userId: effectiveUserId,
      userName: effectiveUserName,
      userEmail: effectiveUserEmail,
      uniqueId: effectiveUniqueId,
      userRole: effectiveUserRole,
      category: normalizedCategory as "suggestion" | "bug" | "general",
      message: message.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "আপনার মতামত সফলভাবে অ্যাডমিনের কাছে পৌঁছেছে!",
        feedback,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
