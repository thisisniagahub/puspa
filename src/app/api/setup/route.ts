// ============================================================
// Auto-Setup Route — Creates tables & seeds data in Supabase
// Call once after deploy: GET /api/setup?secret=puspa-setup-2025
// Uses raw SQL via fetch to Supabase pg/query endpoint
// Protected by SETUP_SECRET env var
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SETUP_SECRET = process.env.SETUP_SECRET || "puspa-setup-2025";

// SQL to create all tables
const CREATE_TABLES_SQL = `
-- Users
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'volunteer',
  "avatar" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Programmes
CREATE TABLE IF NOT EXISTS "Programme" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT 'food_aid',
  "status" TEXT NOT NULL DEFAULT 'active',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "location" TEXT,
  "targetBeneficiaries" INTEGER NOT NULL DEFAULT 0,
  "actualBeneficiaries" INTEGER NOT NULL DEFAULT 0,
  "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "partners" TEXT,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Programme" ADD CONSTRAINT "Programme_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cases
CREATE TABLE IF NOT EXISTS "Case" (
  "id" TEXT PRIMARY KEY,
  "caseNumber" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "applicantName" TEXT NOT NULL,
  "applicantIc" TEXT NOT NULL UNIQUE,
  "applicantPhone" TEXT,
  "applicantEmail" TEXT,
  "applicantAddress" TEXT,
  "householdSize" INTEGER NOT NULL DEFAULT 1,
  "monthlyIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL DEFAULT 'zakat',
  "subcategory" TEXT,
  "programmeId" TEXT,
  "assignedTo" TEXT,
  "verifiedBy" TEXT,
  "approvedBy" TEXT,
  "verificationScore" DOUBLE PRECISION,
  "approvalNotes" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "followUpDate" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "notes" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Case" ADD CONSTRAINT "Case_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Case" ADD CONSTRAINT "Case_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Case" ADD CONSTRAINT "Case_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Case" ADD CONSTRAINT "Case_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Case Notes
CREATE TABLE IF NOT EXISTS "CaseNote" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'note',
  "content" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Case Documents
CREATE TABLE IF NOT EXISTS "CaseDocument" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'other',
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "CaseDocument" ADD CONSTRAINT "CaseDocument_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Donations
CREATE TABLE IF NOT EXISTS "Donation" (
  "id" TEXT PRIMARY KEY,
  "donorName" TEXT NOT NULL,
  "donorEmail" TEXT,
  "donorPhone" TEXT,
  "donorIc" TEXT,
  "donorAddress" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'bank-transfer',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "receiptNumber" TEXT,
  "referenceNumber" TEXT,
  "programmeId" TEXT,
  "caseId" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "isTaxDeductible" BOOLEAN NOT NULL DEFAULT false,
  "paymentChannel" TEXT,
  "notes" TEXT,
  "metadata" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Donation" ADD CONSTRAINT "Donation_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Donation" ADD CONSTRAINT "Donation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Disbursements
CREATE TABLE IF NOT EXISTS "Disbursement" (
  "id" TEXT PRIMARY KEY,
  "disbursementNumber" TEXT NOT NULL UNIQUE,
  "caseId" TEXT NOT NULL,
  "programmeId" TEXT,
  "approvedBy" TEXT NOT NULL,
  "processedBy" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'bank_transfer',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "bankName" TEXT,
  "accountNumber" TEXT,
  "accountHolder" TEXT,
  "recipientName" TEXT NOT NULL,
  "recipientIc" TEXT NOT NULL,
  "recipientPhone" TEXT,
  "purpose" TEXT NOT NULL,
  "notes" TEXT,
  "scheduledDate" TIMESTAMP(3),
  "processedDate" TIMESTAMP(3),
  "receiptFile" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Audit Log
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "details" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "actionUrl" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Programme" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Donation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Disbursement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Permissive policies for service_role and authenticated
CREATE POLICY "service_role_all" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Programme" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Case" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "CaseNote" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "CaseDocument" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Donation" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Disbursement" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "AuditLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Notification" FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON "User" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "Programme" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "Case" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "CaseNote" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "CaseDocument" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "Donation" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "Disbursement" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "AuditLog" FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON "Notification" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "anon_read_all" ON "User" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "Programme" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "Case" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "CaseNote" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "CaseDocument" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "Donation" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "Disbursement" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "AuditLog" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_all" ON "Notification" FOR SELECT TO anon USING (true);
`;

async function hashPw(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "puspa-session-secret-change-in-production");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(request: NextRequest) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid setup secret" }, { status: 403 });
  }

  const results: string[] = [];

  try {
    // Step 1: Create tables via Supabase SQL API
    results.push("Creating tables via Supabase SQL API...");

    const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE,
        "Authorization": `Bearer ${SERVICE_ROLE}`,
      },
      body: JSON.stringify({ sql: CREATE_TABLES_SQL }),
    });

    if (sqlRes.ok) {
      results.push("✅ Tables created successfully via RPC");
    } else {
      const errText = await sqlRes.text();
      results.push(`ℹ️ RPC not available (${sqlRes.status}), trying direct insert...`);

      // Try direct REST API approach — check if User table exists
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/User?select=id&limit=1`, {
        headers: {
          "apikey": SERVICE_ROLE,
          "Authorization": `Bearer ${SERVICE_ROLE}`,
        },
      });

      if (!checkRes.ok) {
        results.push("❌ Tables don't exist yet. Run SQL manually in Supabase Dashboard → SQL Editor.");
        results.push("");
        results.push("OR add this function first in SQL Editor:");
        results.push(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql; END; $$;
        `);
        results.push("");
        results.push("Then call this setup endpoint again.");
      } else {
        results.push("✅ Tables already exist!");
      }
    }

    // Step 2: Seed users via REST API
    results.push("Seeding demo users...");

    const users = [
      { id: "admin-001", email: "admin@puspa.org", name: "Pentadbir PUSPA", password: await hashPw("admin123"), role: "admin" },
      { id: "ops-001", email: "ops@puspa.org", name: "Pegawai Operasi", password: await hashPw("ops123"), role: "ops" },
      { id: "fin-001", email: "finance@puspa.org", name: "Pegawai Kewangan", password: await hashPw("finance123"), role: "finance" },
      { id: "vol-001", email: "volunteer@puspa.org", name: "Sukarelawan", password: await hashPw("volunteer123"), role: "volunteer" },
    ];

    for (const user of users) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SERVICE_ROLE,
          "Authorization": `Bearer ${SERVICE_ROLE}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify(user),
      });
      if (res.ok || res.status === 409) {
        results.push(`  ✅ ${user.email} (${user.role})`);
      } else {
        const t = await res.text();
        results.push(`  ⚠️ ${user.email}: ${t.substring(0, 80)}`);
      }
    }

    // Step 3: Verify
    const verify = await fetch(`${SUPABASE_URL}/rest/v1/User?select=id,email,role`, {
      headers: { "apikey": SERVICE_ROLE, "Authorization": `Bearer ${SERVICE_ROLE}` },
    });
    if (verify.ok) {
      const u = await verify.json();
      results.push(`✅ Database has ${u.length} users`);
    }

    return NextResponse.json({ success: true, message: "PUSPA setup complete!", results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error), results },
      { status: 500 },
    );
  }
}
