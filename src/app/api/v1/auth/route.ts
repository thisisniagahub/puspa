import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, apiUnauthorized, getPaginationParams, buildPagination } from "@/lib/api-response";
import { loginSchema, userCreateSchema } from "@/lib/validators";
import { createSession, hashPassword, verifyPassword, requireAuth, getAuthSession, destroySession, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/v1/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Route: login vs register based on presence of 'name' field
    if (body.name) {
      return handleRegister(request, body);
    }

    return handleLogin(request, body);
  } catch (error) {
    console.error("[AUTH] POST error:", error);
    return apiError("Ralat pengesahan", 500);
  }
}

// POST /api/v1/auth/logout
async function handleLogout(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (token) destroySession(token);

  // Also clear cookie
  const response = apiSuccess({ message: "Berjaya log keluar" });
  response.headers.set("Set-Cookie", "puspa_token=; Path=/; HttpOnly; Max-Age=0");
  return response;
}

async function handleLogin(request: NextRequest, body: unknown) {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, password: true, isActive: true },
  });

  if (!user) {
    // Don't reveal that user doesn't exist
    return apiError("Emel atau kata laluan tidak sah", 401);
  }

  if (!user.isActive) {
    return apiError("Akaun telah dinyahaktifkan", 403);
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return apiError("Emel atau kata laluan tidak sah", 401);
  }

  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Create session
  const { token, expiresAt } = await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  await createAuditLog({
    userId: user.id,
    action: "login",
    entity: "user",
    entityId: user.id,
    ipAddress: getClientIp(request),
  });

  const response = apiSuccess({
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }, { message: "Berjaya log masuk" });

  // Set cookie
  response.headers.set("Set-Cookie", `puspa_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`);

  return response;
}

async function handleRegister(request: NextRequest, body: unknown) {
  // Only admin can create users
  const session = getAuthSession(request);
  if (!session) {
    return apiUnauthorized("Sesi tidak sah");
  }
  if (session.role !== "admin") {
    return apiError("Hanya pentadbir boleh mencipta pengguna", 403);
  }

  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
  }

  const data = parsed.data;

  // Check if email exists
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return apiError("Emel sudah wujud dalam sistem", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  await createAuditLog({
    userId: session.userId,
    action: "create",
    entity: "user",
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: getClientIp(request),
  });

  return apiCreated(user, "Pengguna berjaya dicipta");
}

// GET /api/v1/auth/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    const session = getAuthSession(request);
    if (!session) {
      return apiUnauthorized("Sesi tidak sah");
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        isActive: true, lastLogin: true, createdAt: true,
      },
    });

    if (!user) {
      return apiUnauthorized("Pengguna tidak dijumpai");
    }

    return apiSuccess({
      ...user,
      permissions: getPermissionsForRole(session.role),
    });
  } catch (error) {
    console.error("[AUTH] GET error:", error);
    return apiError("Gagal memuatkan profil", 500);
  }
}

// DELETE /api/v1/auth/logout
export async function DELETE(request: NextRequest) {
  return handleLogout(request);
}

function getPermissionsForRole(role: string) {
  const permissions: string[] = [];
  for (const [perm, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(role)) permissions.push(perm);
  }
  return permissions;
}
