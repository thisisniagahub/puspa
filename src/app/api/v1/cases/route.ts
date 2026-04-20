import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { NextRequest } from "next/server";

// GET /api/v1/cases - List cases with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);
    
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const programmeId = searchParams.get("programmeId");
    const assignedTo = searchParams.get("assignedTo");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { caseNumber: { contains: search } },
        { applicantName: { contains: search } },
        { applicantIc: { contains: search } },
        { title: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (programmeId) where.programmeId = programmeId;
    if (assignedTo) where.assignedTo = assignedTo;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          programme: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true, role: true } },
        },
      }),
      db.case.count({ where }),
    ]);

    return apiSuccess(cases, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error("[CASES] GET error:", error);
    return apiError("Gagal memuatkan senarai kes", 500);
  }
}

// POST /api/v1/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.applicantName) return apiError("Nama pemohon diperlukan");
    if (!body.applicantIc) return apiError("No. IC pemohon diperlukan");
    if (!body.applicantPhone) return apiError("No. telefon diperlukan");

    // Check IC uniqueness
    const existing = await db.case.findUnique({ where: { applicantIc: body.applicantIc } });
    if (existing) return apiError("No. IC sudah wujud dalam sistem", 409);

    // Generate case number: CS-YYYY-XXXX
    const year = new Date().getFullYear();
    const caseCount = await db.case.count({
      where: { caseNumber: { startsWith: `CS-${year}` } },
    });
    const caseNumber = `CS-${year}-${String(caseCount + 1).padStart(4, "0")}`;

    // Determine initial status
    const status = body.submitLater ? "draft" : "submitted";

    const newCase = await db.case.create({
      data: {
        caseNumber,
        title: body.title ?? `Kes ${body.applicantName}`,
        description: body.description,
        status,
        priority: body.priority ?? "normal",
        category: body.category ?? "zakat",
        subcategory: body.subcategory,
        applicantName: body.applicantName,
        applicantIc: body.applicantIc,
        applicantPhone: body.applicantPhone,
        applicantEmail: body.applicantEmail,
        applicantAddress: body.applicantAddress,
        householdSize: body.householdSize ?? 1,
        monthlyIncome: body.monthlyIncome ?? 0,
        programmeId: body.programmeId,
        notes: body.notes,
      },
      include: {
        programme: true,
        assignee: true,
      },
    });

    return apiCreated(newCase, "Kes berjaya dicipta");
  } catch (error) {
    console.error("[CASES] POST error:", error);
    return apiError("Gagal mencipta kes", 500);
  }
}
