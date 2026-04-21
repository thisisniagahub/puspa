// ============================================================
// Session Management — Simplified token-based auth for PUSPA
// Uses a JWT-like approach with HMAC-SHA256 tokens stored in cookies
// ============================================================

import { db } from "@/lib/db";
import { ROLES, type UserRole, hasPermission, type Permission } from "@/lib/auth";
import { getServerEnv } from "@/lib/env";
import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_SECRET = getServerEnv("TOKEN_SECRET", {
  defaultValue: "dev-only-token-secret-change-me-now",
  minLength: 24,
});
const TOKEN_EXPIRY_HOURS = 24;

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

function signTokenPayload(payloadBase64: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(payloadBase64).digest("base64url");
}

function generateToken(payload: SessionPayload): string {
  const sessionData: SessionData = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };

  const encodedPayload = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
  const signature = signTokenPayload(encodedPayload);
  return `puspa.${encodedPayload}.${signature}`;
}

function decodeToken(token: string): SessionData | null {
  try {
    if (!token.startsWith("puspa.")) return null;

    const [, encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = signTokenPayload(encodedPayload);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionData;
    if (!parsed?.userId || !parsed?.email || !parsed?.role || !parsed?.expiresAt) return null;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// Public API
// ============================================================

export async function createSession(user: { id: string; email: string; name: string; role: string }): Promise<{ token: string; expiresAt: number }> {
  const role = user.role as UserRole;
  const token = generateToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role,
  });
  const sessionData = decodeToken(token);
  const expiresAt = sessionData?.expiresAt ?? Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  return { token, expiresAt };
}

export function getSession(token: string): SessionData | null {
  return decodeToken(token);
}

export function destroySession(token: string): void {
  void token;
}

// ============================================================
// Simple password hashing (bcrypt would be better, but keeping it lightweight)
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  // Use a simple hash for demo purposes
  // In production, use bcrypt: await bcrypt.hash(password, 10)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + TOKEN_SECRET);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============================================================
// Auth helpers for API routes
// ============================================================

export function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)puspa_token=([^;]*)/);
    if (match) return match[1];
  }

  return null;
}

export function getAuthSession(request: Request): SessionData | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return getSession(token);
}

export function requireAuth(request: Request): SessionData {
  const session = getAuthSession(request);
  if (!session) {
    throw new AuthError("Sesi tidak sah atau telah tamat", 401);
  }
  return session;
}

export function requirePermission(session: SessionData, permission: Permission): void {
  if (!hasPermission(session.role, permission)) {
    throw new AuthError("Tiada kebenaran untuk tindakan ini", 403);
  }
}

export function requireRole(session: SessionData, roles: UserRole[]): void {
  if (!roles.includes(session.role)) {
    throw new AuthError("Peran tidak dibenarkan untuk tindakan ini", 403);
  }
}

// ============================================================
// Custom error class
// ============================================================

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}
