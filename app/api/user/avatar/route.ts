import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let avatarUrl: string | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      avatarUrl = body.avatarUrl || body.avatar || null;
    } else {
      const formData = await req.formData();
      const file = (formData.get("avatar") || formData.get("file")) as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        avatarUrl = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      } else {
        avatarUrl = (formData.get("avatarUrl") as string) || null;
      }
    }

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json(
        { error: "Valid avatarUrl (Base64 data URL or image link) is required." },
        { status: 400 }
      );
    }

    // Update both avatarUrl and avatar in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
        avatar: avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        avatarUrl: true,
        institution: true,
        grade: true,
        bio: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
      avatar: updatedUser.avatar,
      user: updatedUser,
      message: "Profile picture updated successfully!",
    });
  } catch (error: any) {
    console.error("Error updating user avatar:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during avatar update." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    let userId = session?.id;

    if (!userId) {
      const email = req.cookies.get("classpulse_user_email")?.value;
      if (email) {
        const found = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatar: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        avatarUrl: true,
        institution: true,
        grade: true,
        bio: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile picture removed.",
    });
  } catch (error: any) {
    console.error("Error removing user avatar:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during avatar removal." },
      { status: 500 }
    );
  }
}
