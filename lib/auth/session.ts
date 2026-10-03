import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyJwtToken, AuthJwtPayload } from "./jwt";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "classpulse_token";

export async function getSessionUser(req?: NextRequest): Promise<AuthJwtPayload | null> {
  // 1. Try to read from incoming NextRequest cookies
  let token = req?.cookies?.get(AUTH_COOKIE_NAME)?.value;

  // 2. Try Authorization header: Bearer <token>
  if (!token && req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Fall back to next/headers cookies()
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch (e) {
      // cookies() might throw in edge/static contexts
    }
  }

  // 4. Verify token if found
  if (token) {
    const session = await verifyJwtToken(token);
    if (session?.id) return session;
  }

  return null;
}

export async function getCurrentDbUser(req?: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        institution: true,
        grade: true,
        bio: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
