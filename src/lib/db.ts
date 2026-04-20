// ============================================================================
// Database client — auto-selects backend based on environment
// ============================================================================
// Development  → PrismaClient (direct connection via port 5432 / SQLite)
// Production   → Supabase REST API (PostgREST) over HTTPS
//
// Both expose the same db.user / db.case / etc. interface so that all
// existing service code continues to work without changes.
// ============================================================================

import { PrismaClient } from "@prisma/client";
import { createSupabaseClient, SupabaseDbClient } from "./supabase-db";

// ─── Prisma client (development) ───────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// ─── Environment detection ─────────────────────────────────────────────────

function isSupabaseRestEnabled(): boolean {
  // Enable when:
  //  1. Running in production (Vercel), OR
  //  2. USE_SUPABASE_REST env var is explicitly "true" (for local testing)
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.USE_SUPABASE_REST === "true") return true;
  return false;
}

// ─── Exported db instance ─────────────────────────────────────────────────

/**
 * Unified database client.
 *
 * In development: backed by PrismaClient (direct PostgreSQL / SQLite).
 * In production:  backed by Supabase REST API (PostgREST) over HTTPS.
 *
 * Both expose the same model delegates (db.user, db.case, …) so that
 * every existing call site works without modification.
 */
let _db: PrismaClient | SupabaseDbClient;

if (isSupabaseRestEnabled()) {
  _db = createSupabaseClient();
} else {
  _db = globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _db;
}

export const db = _db;

// Re-export types for convenience
export type { SupabaseDbClient };
