import { cookies } from "next/headers";
import { verifyJwtToken, AuthJwtPayload } from "./jwt";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "classpulse_token";

export async function getSessionUser(): Promise<AuthJwtPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyJwtToken(token);
}

export async function getCurrentDbUser() {
  const session = await getSessionUser();
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
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}
