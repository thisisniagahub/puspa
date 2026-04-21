type OpenClawEventType =
  | "case_created"
  | "case_status_changed"
  | "donation_recorded"
  | "donation_received"
  | "donation_status_changed"
  | "disbursement_created"
  | "disbursement_status_changed"
  | "disbursement_completed";

interface OpenClawEventEnvelope {
  source: "puspa";
  eventType: OpenClawEventType;
  occurredAt: string;
  entity: string;
  entityId: string;
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

function getWebhookConfig() {
  return {
    url: process.env.PUSPA_OPENCLAW_WEBHOOK_URL?.trim(),
    secret: process.env.PUSPA_OPENCLAW_WEBHOOK_SECRET?.trim(),
  };
}

export async function sendOpenClawWebhook(event: OpenClawEventEnvelope): Promise<void> {
  const { url, secret } = getWebhookConfig();
  if (!isWebhookEnabled() || !url) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[OpenClaw Webhook] ${response.status} ${response.statusText} ${text}`.trim());
    }
  } catch (error) {
    console.warn("[OpenClaw Webhook] Delivery failed:", error);
  }
}

export function buildOpenClawEvent(params: OpenClawEventEnvelope): OpenClawEventEnvelope {
  return params;
}
