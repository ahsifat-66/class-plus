import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_AVATARS = {
  TEACHER: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  ],
  STUDENT: [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role (TEACHER or STUDENT) are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const avatarList = DEFAULT_AVATARS[normalizedRole as keyof typeof DEFAULT_AVATARS];
      const randomAvatar = avatarList[Math.floor(Math.random() * avatarList.length)];

      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          role: normalizedRole,
          avatar: randomAvatar,
        },
      });
    }

    const response = NextResponse.json({
      user,
      message: "Signed in successfully!",
    });

    response.cookies.set("classpulse_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in user registration / sign in:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
