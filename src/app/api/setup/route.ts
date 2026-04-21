// ============================================================
// Auto-Setup Route — Checks database state & seeds demo users
// Call once after deploy: GET /api/setup?secret=puspa-setup-2025
// Uses Prisma ORM (db) — tables are created via Prisma Migrate
// during Vercel build (postinstall → prisma db push)
// Protected by SETUP_SECRET env var
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getServerEnv, isDemoModeEnabled, isSetupRouteEnabled } from "@/lib/env";

const SETUP_SECRET = getServerEnv("SETUP_SECRET", {
  defaultValue: "dev-only-setup-secret-change-me-now",
  minLength: 24,
});

// Demo users to seed on first run
const DEMO_USERS = [
  {
    email: "admin@puspa.org",
    name: "Pentadbir PUSPA",
    password: "admin123",
    role: "admin",
  },
  {
    email: "ops@puspa.org",
    name: "Pegawai Operasi",
    password: "ops123",
    role: "ops",
  },
  {
    email: "finance@puspa.org",
    name: "Pegawai Kewangan",
    password: "finance123",
    role: "finance",
  },
  {
    email: "volunteer@puspa.org",
    name: "Sukarelawan Ahmad",
    password: "volunteer123",
    role: "volunteer",
  },
] as const;

export async function POST(request: NextRequest) {
  if (!isSetupRouteEnabled()) {
    return apiError("Setup route disabled", 404);
  }

  if (!isDemoModeEnabled()) {
    return apiError("Demo seeding disabled", 403);
  }

  // ── 1. Validate secret ─────────────────────────────────────────
  const body = await request.json().catch(() => ({}));
  const secret = typeof body?.secret === "string" ? body.secret : request.headers.get("x-setup-secret");
  if (secret !== SETUP_SECRET) {
    return apiError("Invalid setup secret", 403);
  }

  // ── 2. Check if database tables exist ──────────────────────────
  try {
    const userCount = await db.user.count();

    // Tables exist — check if already seeded
    if (userCount > 0) {
      return apiSuccess(
        {
          status: "already_setup",
          userCount,
          message: `Database already has ${userCount} user(s). Setup complete.`,
        },
        { message: "PUSPA already set up" },
      );
    }

    // ── 3. Seed demo users ───────────────────────────────────────
    const hashedPasswords = await Promise.all(
      DEMO_USERS.map((u) => hashPassword(u.password)),
    );

    const result = await db.user.createMany({
      data: DEMO_USERS.map((u, i) => ({
        email: u.email,
        name: u.name,
        password: hashedPasswords[i],
        role: u.role,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    return apiSuccess(
      {
        status: "seeded",
        usersCreated: result.count,
        demoAccounts: DEMO_USERS.map((u) => ({ email: u.email, role: u.role, name: u.name })),
      },
      { message: "PUSPA setup complete. Demo users seeded." },
    );
  } catch (error) {
    // Prisma failed — tables likely don't exist yet
    const message =
      error instanceof Error ? error.message : String(error);

    // Detect Prisma "table doesn't exist" errors
    const isTableMissing =
      message.includes("relation") &&
      (message.includes("does not exist") ||
        message.includes("Does not exist"));

    if (isTableMissing) {
      return apiError(
        "Database tables do not exist yet. They will be created automatically during Vercel build via Prisma Migrate (prisma db push). Please redeploy or run `npx prisma db push` manually.",
        503,
        { hint: "Run `npx prisma db push` to create tables, then call this endpoint again.", rawError: message },
      );
    }

    // Other unexpected errors
    console.error("[SETUP] Unexpected error:", error);
    return apiError("Setup failed due to unexpected error", 500, {
      details: message,
    });
  }
}
