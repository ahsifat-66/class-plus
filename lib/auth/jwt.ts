import { SignJWT, jwtVerify } from "jose";

export interface AuthJwtPayload {
  id: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  name: string;
}

const JWT_SECRET_STR =
  process.env.JWT_SECRET || "classpulse_super_secure_jwt_secret_2026_key_fallback";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export async function signJwtToken(payload: AuthJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifyJwtToken(token: string): Promise<AuthJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as "TEACHER" | "STUDENT",
      name: payload.name as string,
    };
  } catch (error) {
    return null;
  }
}
