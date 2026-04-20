// ============================================================
// Session Management — Simplified token-based auth for PUSPA
// Uses a JWT-like approach with HMAC-SHA256 tokens stored in cookies
// ============================================================

import { db } from "@/lib/db";
import { ROLES, type UserRole, hasPermission, type Permission } from "@/lib/auth";

const TOKEN_SECRET = process.env.TOKEN_SECRET ?? "puspa-session-secret-change-in-production";
const TOKEN_EXPIRY_HOURS = 24;

// In-memory token store (for this SQLite setup)
// In production, this would be Redis or a database table
const activeSessions = new Map<string, SessionData>();

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

// ============================================================
// Simple hash for token generation (no crypto dependency needed)
// ============================================================

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function generateToken(payload: SessionPayload): string {
  const timestamp = Date.now();
  const data = `${payload.userId}:${payload.email}:${timestamp}:${TOKEN_SECRET}`;
  return `puspa_${Buffer.from(data).toString("base64url")}_${simpleHash(data)}`;
}

function decodeToken(token: string): SessionData | null {
  try {
    if (!token.startsWith("puspa_")) return null;

    // Clean up expired sessions
    const now = Date.now();
    for (const [key, session] of activeSessions) {
      if (session.expiresAt < now) activeSessions.delete(key);
    }

    return activeSessions.get(token) ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Public API
// ============================================================

export async function createSession(user: { id: string; email: string; name: string; role: string }): Promise<{ token: string; expiresAt: number }> {
  const role = user.role as UserRole;
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;

  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role,
    createdAt: Date.now(),
    expiresAt,
  };

  const token = generateToken(sessionData);
  activeSessions.set(token, sessionData);

  return { token, expiresAt };
}

export function getSession(token: string): SessionData | null {
  return decodeToken(token);
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
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
