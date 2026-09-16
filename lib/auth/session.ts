import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyJwtToken, AuthJwtPayload } from "./jwt";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "classpulse_token";

export async function getSessionUser(req?: NextRequest): Promise<AuthJwtPayload | null> {
  // 1. Try to read from incoming NextRequest cookies
  let token = req?.cookies.get(AUTH_COOKIE_NAME)?.value;

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

  // 5. Fallback session recovery using email cookie if token is missing/expired
  let fallbackEmail: string | undefined = req?.cookies.get("classpulse_user_email")?.value;
  if (!fallbackEmail) {
    try {
      const cookieStore = cookies();
      fallbackEmail = cookieStore.get("classpulse_user_email")?.value;
    } catch (e) {
      // ignore
    }
  }

  if (fallbackEmail) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: fallbackEmail },
        select: { id: true, email: true, role: true, name: true },
      });
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
          name: dbUser.name,
        };
      }
    } catch (err) {
      // ignore
    }
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
