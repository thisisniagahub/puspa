import { describe, it, expect } from "bun:test";
import { buildTelegramMessage, type OpenClawEventEnvelope } from "./openclaw-webhook";

describe("buildTelegramMessage", () => {
  it("formats case_created correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "case_created",
      occurredAt: new Date().toISOString(),
      entity: "case",
      entityId: "123",
      data: {
        caseNumber: "CASE-001",
        applicantName: "Ali Bin Abu",
        programmeName: "Bantuan Bencana",
      },
      actor: {
        userId: "u1",
        name: "Admin User",
      },
    };

    const message = buildTelegramMessage(event);
    expect(message).toBe(
      "🆕 PUSPA case baru\nCASE-001\nPemohon: Ali Bin Abu\nProgram: Bantuan Bencana\n\n👤 Admin User"
    );
  });

  it("formats case_created correctly with minimal data", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "case_created",
      occurredAt: new Date().toISOString(),
      entity: "case",
      entityId: "123",
      data: {},
    };

    const message = buildTelegramMessage(event);
    expect(message).toBe("🆕 PUSPA case baru\n123");
  });

  it("formats case_status_changed correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "case_status_changed",
      occurredAt: new Date().toISOString(),
      entity: "case",
      entityId: "123",
      data: {
        caseNumber: "CASE-001",
        previousStatus: "Pending",
        status: "Approved",
      },
    };

    const message = buildTelegramMessage(event);
    expect(message).toBe("📌 Status case berubah\nCASE-001\nStatus: Pending → Approved");
  });

  it("formats donation_received correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "donation_received",
      occurredAt: new Date().toISOString(),
      entity: "donation",
      entityId: "123",
      data: {
        referenceNumber: "DON-001",
        amount: 50.5,
        donorName: "Siti Aminah",
        status: "Completed",
      },
    };

    const message = buildTelegramMessage(event);
    // Note: formatCurrency formats as MYR. It includes a narrow no-break space or non-breaking space depending on Intl formatting
    expect(message).toContain("💰 Donation diterima\nDON-001");
    expect(message).toContain("Jumlah: RM");
    expect(message).toContain("50.50");
    expect(message).toContain("Penderma: Siti Aminah\nStatus: Completed");
  });

  it("formats donation_recorded correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "donation_recorded",
      occurredAt: new Date().toISOString(),
      entity: "donation",
      entityId: "456",
      data: {
        amount: 100,
      },
    };

    const message = buildTelegramMessage(event);
    expect(message).toContain("🧾 Update donation PUSPA\n456");
    expect(message).toContain("Jumlah: RM");
    expect(message).toContain("100.00");
  });

  it("formats disbursement_completed correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "disbursement_completed",
      occurredAt: new Date().toISOString(),
      entity: "disbursement",
      entityId: "789",
      data: {
        disbursementNumber: "DISB-001",
        amount: 200,
        recipientName: "Ahmad",
      },
      actor: {
        userId: "u2",
        name: "System",
      },
    };

    const message = buildTelegramMessage(event);
    expect(message).toContain("✅ Disbursement selesai\nDISB-001");
    expect(message).toContain("Jumlah: RM");
    expect(message).toContain("200.00");
    expect(message).toContain("Penerima: Ahmad\n\n👤 System");
  });

  it("formats disbursement_created correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "disbursement_created",
      occurredAt: new Date().toISOString(),
      entity: "disbursement",
      entityId: "789",
      data: {
        status: "Pending",
      },
    };

    const message = buildTelegramMessage(event);
    expect(message).toBe("🏦 Update disbursement PUSPA\n789\nStatus: Pending");
  });

  it("formats default event correctly", () => {
    const event: OpenClawEventEnvelope = {
      source: "puspa",
      eventType: "capture_created",
      occurredAt: new Date().toISOString(),
      entity: "capture",
      entityId: "999",
      data: {},
    };

    const message = buildTelegramMessage(event);
    expect(message).toBe("📣 PUSPA event\ncapture_created\ncapture 999");
  });
});
