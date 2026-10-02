import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createFeedback } from "@/lib/feedback/store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, message, userId, userName, userEmail, uniqueId, userRole } = body;

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "মতামত বা বিবরণের জন্য কমপক্ষে ১০টি অক্ষর লিখুন।" },
        { status: 400 }
      );
    }

    const validCategories = ["suggestion", "bug", "general"];
    const normalizedCategory = validCategories.includes(category) ? category : "general";

    // Attempt to recover session user if info missing
    const session = await getSessionUser(req);
    let effectiveUserId = userId || session?.id || "anonymous";
    let effectiveUserName = userName || session?.name || "Anonymous";
    let effectiveUserEmail = userEmail || session?.email || "";
    let effectiveUserRole = userRole || session?.role || "student";
    let effectiveUniqueId = uniqueId || "N/A";

    if (session?.id && (!userEmail || !uniqueId)) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.id },
          select: { email: true, name: true, role: true, uniqueId: true },
        });
        if (dbUser) {
          effectiveUserEmail = effectiveUserEmail || dbUser.email;
          effectiveUserName = effectiveUserName || dbUser.name;
          effectiveUserRole = effectiveUserRole || dbUser.role;
          effectiveUniqueId = effectiveUniqueId === "N/A" ? dbUser.uniqueId || "N/A" : effectiveUniqueId;
        }
      } catch (err) {
        // ignore
      }
    }

    const feedback = createFeedback({
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
        message: "ধন্যবাদ! আপনার মতামত সফলভাবে অ্যাডমিনের কাছে পাঠানো হয়েছে।",
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
