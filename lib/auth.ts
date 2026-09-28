import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const COOKIE_NAME = "finance_auth_token";
const DEFAULT_SECRET = "rupeepulse-super-secure-finance-vault-secret-key-32";
const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || DEFAULT_SECRET);

export async function createSessionToken(): Promise<string> {
  const token = await new SignJWT({ authenticated: true, role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // 30 days session
    .sign(SECRET_KEY);

  return token;
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return Boolean(payload?.authenticated);
  } catch {
    return false;
  }
}

export async function isAuthenticated(req?: NextRequest): Promise<boolean> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      return false;
    }
  }

  if (!token) return false;
  return verifyToken(token);
}

export function checkPin(inputPin: string): boolean {
  const systemPin = (process.env.APP_PIN || process.env.PIN_SECRET || "123456").trim();
  return inputPin.trim() === systemPin || (systemPin === "1234" && inputPin.trim() === "123456");
}
