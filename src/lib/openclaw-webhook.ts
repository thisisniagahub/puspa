export type OpenClawEventType =
  | "case_created"
  | "case_status_changed"
  | "donation_recorded"
  | "donation_received"
  | "donation_status_changed"
  | "disbursement_created"
  | "disbursement_status_changed"
  | "disbursement_completed"
  | "capture_created"
  | "capture_converted";

export interface OpenClawEventEnvelope {
  schemaVersion?: "1";
  correlationId?: string;
  source: "puspa";
  eventType: OpenClawEventType;
  occurredAt: string;
  entity: string;
  entityId: string;
  delivery?: {
    attempt?: number;
  };
  actor?: {
    userId: string;
    name?: string;
    role?: string;
  };
  data: Record<string, unknown>;
}

function isWebhookEnabled() {
  return process.env.PUSPA_OPENCLAW_WEBHOOK_ENABLED === "true";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit, retries = 3) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < retries) {
      const backoff = 400 * Math.pow(2, attempt - 1);
      await sleep(backoff);
    }
  }
  throw lastError;
}

function getWebhookConfig() {
  return {
    url: process.env.PUSPA_OPENCLAW_WEBHOOK_URL?.trim(),
    secret: process.env.PUSPA_OPENCLAW_WEBHOOK_SECRET?.trim(),
  };
}

function isTelegramEnabled() {
  return process.env.PUSPA_TELEGRAM_ENABLED === "true";
}

function getTelegramConfig() {
  return {
    botToken: process.env.PUSPA_TELEGRAM_BOT_TOKEN?.trim(),
    chatId: process.env.PUSPA_TELEGRAM_CHAT_ID?.trim(),
  };
}

function formatCurrency(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return null;

  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function buildTelegramMessage(event: OpenClawEventEnvelope) {
  const amount = formatCurrency(event.data.amount);
  const actor = event.actor?.name ? `\n👤 ${event.actor.name}` : "";

  switch (event.eventType) {
    case "case_created":
      return [
        "🆕 PUSPA case baru",
        `${String(event.data.caseNumber ?? event.entityId)}`,
        event.data.applicantName ? `Pemohon: ${String(event.data.applicantName)}` : null,
        event.data.programmeName ? `Program: ${String(event.data.programmeName)}` : null,
        actor || null,
      ].filter(Boolean).join("\n");

    case "case_status_changed":
      return [
        "📌 Status case berubah",
        `${String(event.data.caseNumber ?? event.entityId)}`,
        `Status: ${String(event.data.previousStatus ?? "-")} → ${String(event.data.status ?? "-")}`,
        actor || null,
      ].filter(Boolean).join("\n");

    case "donation_recorded":
    case "donation_received":
    case "donation_status_changed":
      return [
        event.eventType === "donation_received" ? "💰 Donation diterima" : "🧾 Update donation PUSPA",
        `${String(event.data.referenceNumber ?? event.entityId)}`,
        amount ? `Jumlah: ${amount}` : null,
        event.data.donorName ? `Penderma: ${String(event.data.donorName)}` : null,
        event.data.status ? `Status: ${String(event.data.status)}` : null,
        actor || null,
      ].filter(Boolean).join("\n");

    case "disbursement_created":
    case "disbursement_status_changed":
    case "disbursement_completed":
      return [
        event.eventType === "disbursement_completed" ? "✅ Disbursement selesai" : "🏦 Update disbursement PUSPA",
        `${String(event.data.disbursementNumber ?? event.entityId)}`,
        amount ? `Jumlah: ${amount}` : null,
        event.data.recipientName ? `Penerima: ${String(event.data.recipientName)}` : null,
        event.data.status ? `Status: ${String(event.data.status)}` : null,
        actor || null,
      ].filter(Boolean).join("\n");

    default:
      return [
        "📣 PUSPA event",
        `${event.eventType}`,
        `${event.entity} ${event.entityId}`,
      ].join("\n");
  }
}

async function sendTelegramNotification(event: OpenClawEventEnvelope): Promise<void> {
  const { botToken, chatId } = getTelegramConfig();
  if (!isTelegramEnabled() || !botToken || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildTelegramMessage(event),
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[PUSPA Telegram] ${response.status} ${response.statusText} ${text}`.trim());
    }
  } catch (error) {
    console.warn("[PUSPA Telegram] Delivery failed:", error);
  }
}

async function postToOpenClawWebhook(event: OpenClawEventEnvelope): Promise<void> {
  const { url, secret } = getWebhookConfig();
  if (!isWebhookEnabled() || !url) return;

  try {
    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        ...(secret ? { "x-openclaw-webhook-secret": secret } : {}),
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    }, 3);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[OpenClaw Webhook] ${response.status} ${response.statusText} ${text}`.trim());
    }
  } catch (error) {
    console.warn("[OpenClaw Webhook] Delivery failed:", error);
  }
}

export async function sendOpenClawWebhook(event: OpenClawEventEnvelope): Promise<void> {
  await Promise.allSettled([
    postToOpenClawWebhook(event),
    sendTelegramNotification(event),
  ]);
}

export function buildOpenClawEvent(params: OpenClawEventEnvelope): OpenClawEventEnvelope {
  return params;
}
