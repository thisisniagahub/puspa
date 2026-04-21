import { z } from "zod";

// ============================================================
// Common schemas
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const sortSchema = z.object({
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================
// User schemas
// ============================================================

export const userCreateSchema = z.object({
  email: z.string().email("Emel tidak sah"),
  name: z.string().min(2, "Nama minimum 2 aksara").max(100),
  password: z.string().min(6, "Kata laluan minimum 6 aksara"),
  role: z.enum(["admin", "ops", "finance", "volunteer"]).default("volunteer"),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Emel tidak sah").optional(),
  name: z.string().min(2, "Nama minimum 2 aksara").max(100).optional(),
  role: z.enum(["admin", "ops", "finance", "volunteer"]).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Emel tidak sah"),
  password: z.string().min(1, "Kata laluan diperlukan"),
});

// ============================================================
// Case schemas
// ============================================================

export const caseCreateSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).default("normal"),
  category: z.enum(["zakat", "sedekah", "wakaf", "infak", "government_aid"]).default("zakat"),
  subcategory: z.string().max(100).optional(),
  applicantName: z.string().min(2, "Nama pemohon diperlukan").max(100),
  applicantIc: z.string().regex(/^\d{6}-\d{2}-\d{4}$/, "Format IC tidak sah (XXXXXX-XX-XXXX)"),
  applicantPhone: z.string().min(7, "No. telefon diperlukan").max(15),
  applicantEmail: z.string().email("Emel tidak sah").optional().or(z.literal("")),
  applicantAddress: z.string().max(500).optional(),
  householdSize: z.coerce.number().min(1).max(50).default(1),
  monthlyIncome: z.coerce.number().min(0).default(0),
  programmeId: z.string().optional(),
  notes: z.string().max(5000).optional(),
  submitLater: z.boolean().default(false),
});

export const caseUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  category: z.enum(["zakat", "sedekah", "wakaf", "infak", "government_aid"]).optional(),
  subcategory: z.string().max(100).optional(),
  applicantName: z.string().min(2).max(100).optional(),
  applicantPhone: z.string().min(7).max(15).optional(),
  applicantEmail: z.string().email().optional().or(z.literal("")),
  applicantAddress: z.string().max(500).optional(),
  householdSize: z.coerce.number().min(1).max(50).optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
  programmeId: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  status: z.enum([
    "draft", "submitted", "verifying", "verified", "scoring", "scored",
    "approved", "disbursing", "disbursed", "follow_up", "closed", "rejected",
  ]).optional(),
  verificationScore: z.coerce.number().min(0).max(100).optional(),
  verifiedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  rejectionReason: z.string().max(1000).optional(),
  followUpDate: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
});

export const caseNoteCreateSchema = z.object({
  authorId: z.string().min(1, "ID penulis diperlukan"),
  type: z.enum(["note", "phone_call", "visit", "assessment", "document", "status_change", "system"]).default("note"),
  content: z.string().min(1, "Kandungan nota diperlukan").max(5000),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================
// Donation schemas
// ============================================================

export const donationCreateSchema = z.object({
  donorName: z.string().min(2, "Nama penderma diperlukan").max(100),
  donorEmail: z.string().email("Emel tidak sah").optional().or(z.literal("")),
  donorPhone: z.string().max(15).optional(),
  donorIc: z.string().max(20).optional(),
  donorAddress: z.string().max(500).optional(),
  amount: z.coerce.number().positive("Jumlah mesti positif"),
  method: z.enum(["bank-transfer", "cash", "cheque", "ewallet"]).default("bank-transfer"),
  status: z.enum(["pending", "confirmed", "rejected", "refunded"]).default("pending"),
  receiptNumber: z.string().max(50).optional(),
  referenceNumber: z.string().max(50).optional(),
  programmeId: z.string().optional(),
  caseId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  isTaxDeductible: z.boolean().default(false),
  paymentChannel: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().date()),
});

export const donationUpdateSchema = z.object({
  donorName: z.string().min(2).max(100).optional(),
  donorEmail: z.string().email().optional().or(z.literal("")),
  donorPhone: z.string().max(15).optional(),
  donorAddress: z.string().max(500).optional(),
  amount: z.coerce.number().positive().optional(),
  method: z.enum(["bank-transfer", "cash", "cheque", "ewallet"]).optional(),
  status: z.enum(["pending", "confirmed", "rejected", "refunded"]).optional(),
  receiptNumber: z.string().max(50).optional(),
  programmeId: z.string().nullable().optional(),
  isAnonymous: z.boolean().optional(),
  isTaxDeductible: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().date()).optional(),
});

// ============================================================
// Programme schemas
// ============================================================

export const programmeCreateSchema = z.object({
  code: z.string().max(20).optional(),
  name: z.string().min(2, "Nama program diperlukan").max(200),
  description: z.string().max(5000).optional(),
  category: z.enum([
    "food_aid", "education", "skills_training", "healthcare",
    "financial_assistance", "community", "emergency_relief", "dawah",
  ]).default("food_aid"),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).default("active"),
  startDate: z.string().datetime().or(z.string().date()).optional(),
  endDate: z.string().datetime().or(z.string().date()).optional(),
  location: z.string().max(500).optional(),
  targetBeneficiaries: z.coerce.number().min(0).default(0),
  totalBudget: z.coerce.number().min(0).default(0),
  notes: z.string().max(5000).optional(),
});

export const programmeUpdateSchema = z.object({
  code: z.string().max(20).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.enum([
    "food_aid", "education", "skills_training", "healthcare",
    "financial_assistance", "community", "emergency_relief", "dawah",
  ]).optional(),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
  startDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  endDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  location: z.string().max(500).optional(),
  targetBeneficiaries: z.coerce.number().min(0).optional(),
  totalBudget: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

// ============================================================
// Disbursement schemas
// ============================================================

export const disbursementCreateSchema = z.object({
  caseId: z.string().min(1, "ID kes diperlukan"),
  programmeId: z.string().optional(),
  approvedBy: z.string().min(1, "ID pelulus diperlukan"),
  amount: z.coerce.number().positive("Jumlah mesti positif"),
  method: z.enum(["bank_transfer", "cash", "cheque", "ewallet"]).default("bank_transfer"),
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(30).optional(),
  accountHolder: z.string().max(100).optional(),
  recipientName: z.string().min(2, "Nama penerima diperlukan").max(100),
  recipientIc: z.string().min(1, "IC penerima diperlukan").max(20),
  recipientPhone: z.string().max(15).optional(),
  purpose: z.string().min(1, "Tujuan pengagihan diperlukan").max(1000),
  notes: z.string().max(2000).optional(),
  scheduledDate: z.string().datetime().or(z.string().date()).optional(),
});

export const disbursementUpdateSchema = z.object({
  amount: z.coerce.number().positive().optional(),
  method: z.enum(["bank_transfer", "cash", "cheque", "ewallet"]).optional(),
  status: z.enum(["pending", "approved", "processing", "completed", "failed", "cancelled"]).optional(),
  bankName: z.string().max(100).optional(),
  accountNumber: z.string().max(30).optional(),
  accountHolder: z.string().max(100).optional(),
  recipientName: z.string().min(2).max(100).optional(),
  recipientIc: z.string().min(1).max(20).optional(),
  recipientPhone: z.string().max(15).optional(),
  purpose: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  scheduledDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  processedBy: z.string().optional(),
});

// ============================================================
// Report filter schemas
// ============================================================

export const reportFilterSchema = z.object({
  startDate: z.string().datetime().or(z.string().date()).optional(),
  endDate: z.string().datetime().or(z.string().date()).optional(),
  category: z.string().optional(),
  programmeId: z.string().optional(),
  status: z.string().optional(),
});

// ============================================================
// Helper: Parse and validate request body
// ============================================================

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false as const,
      error: firstError?.message ?? "Data tidak sah",
      issues: result.error.issues,
    };
  }
  return { success: true as const, data: result.data };
}
