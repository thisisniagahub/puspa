import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, apiNotFound, getPaginationParams, buildPagination } from "@/lib/api-response";
import { donationCreateSchema, donationUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/donations — List with filtering, search, pagination
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "donations:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const method = searchParams.get("method");
    const programmeId = searchParams.get("programmeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") ?? "date";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { donorName: { contains: search } },
        { donorEmail: { contains: search } },
        { receiptNumber: { contains: search } },
        { referenceNumber: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (method) where.method = method;
    if (programmeId) where.programmeId = programmeId;
    if (startDate || endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.date = dateFilter;
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [donations, total] = await Promise.all([
      db.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          programme: { select: { id: true, name: true, code: true } },
          case: { select: { id: true, caseNumber: true, applicantName: true } },
        },
      }),
      db.donation.count({ where }),
    ]);

    return apiSuccess(donations, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DONATIONS] GET error:", error);
    return apiError("Gagal memuatkan senarai sumbangan", 500);
  }
}

// POST /api/v1/donations — Create donation
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "donations:create");

    const body = await request.json();
    const parsed = donationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;

    // If programmeId is provided, verify it exists
    if (data.programmeId) {
      const programme = await db.programme.findUnique({ where: { id: data.programmeId } });
      if (!programme) return apiError("Program tidak dijumpai", 404);
    }

    const donation = await db.donation.create({
      data: {
        donorName: data.donorName,
        donorEmail: data.donorEmail || null,
        donorPhone: data.donorPhone || null,
        donorIc: data.donorIc || null,
        donorAddress: data.donorAddress || null,
        amount: data.amount,
        method: data.method,
        status: data.status,
        receiptNumber: data.receiptNumber || null,
        referenceNumber: data.referenceNumber || null,
        programmeId: data.programmeId || null,
        caseId: data.caseId || null,
        isAnonymous: data.isAnonymous,
        isTaxDeductible: data.isTaxDeductible,
        paymentChannel: data.paymentChannel || null,
        notes: data.notes || null,
        date: new Date(data.date),
      },
      include: {
        programme: { select: { id: true, name: true, code: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "donation",
      entityId: donation.id,
      details: { amount: data.amount, method: data.method, donor: data.donorName },
      ipAddress: getClientIp(request),
    });

    return apiCreated(donation, "Sumbangan berjaya direkod");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DONATIONS] POST error:", error);
    return apiError("Gagal merekod sumbangan", 500);
  }
}
