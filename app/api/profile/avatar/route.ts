import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

    const contentType = req.headers.get("content-type") || "";
    let avatarUrl: string | null = null;

    // 1. Support direct JSON Base64 Data URL (Fastest & 100% Vercel-compatible)
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const rawAvatar = body.avatar || body.avatarUrl;

      if (!rawAvatar || typeof rawAvatar !== "string") {
        return NextResponse.json(
          { error: "No image data provided." },
          { status: 400 }
        );
      }

      if (!rawAvatar.startsWith("data:image/") && !rawAvatar.startsWith("http")) {
        return NextResponse.json(
          { error: "Invalid image format. Expected an image Data URL." },
          { status: 400 }
        );
      }

      avatarUrl = rawAvatar;
    } else {
      // 2. Support Multipart FormData
      const formData = await req.formData();
      const file = (formData.get("file") || formData.get("avatar")) as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided." }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File exceeds 5MB limit. Please upload a smaller image." },
          { status: 400 }
        );
      }

      // Read buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine file extension
      let ext = "png";
      if (file.type === "image/jpeg") ext = "jpg";
      else if (file.type === "image/webp") ext = "webp";
      else if (file.type === "image/gif") ext = "gif";

      const fileName = `${userId}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

      // Attempt to save to public uploads directory (works on local node server)
      let savedToDisk = false;
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        savedToDisk = true;
        avatarUrl = `/uploads/avatars/${fileName}`;
      } catch (fsError) {
        // On Vercel / serverless, filesystem is read-only. Gracefully fall back to base64 Data URL!
        savedToDisk = false;
      }

      if (!savedToDisk) {
        avatarUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    }

    if (!avatarUrl) {
      return NextResponse.json({ error: "Failed to process image." }, { status: 400 });
    }

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl,
      avatar: avatarUrl,
      user: updatedUser,
      message: "Profile picture updated successfully!",
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during upload." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profile picture removed successfully.",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json({ error: "Internal server error during avatar removal." }, { status: 500 });
  }
}
