# PUSPA x OpenClaw Integration

## Recommended architecture

Keep **PUSPA** as the core NGO operations app and use **OpenClaw** as the automation and agent layer.

Flow:

1. PUSPA records business events in its own database.
2. PUSPA sends outbound webhook events to OpenClaw.
3. OpenClaw turns those events into automations, alerts, summaries, or agent tasks.
4. OpenClaw sends results to Telegram, WhatsApp, Slack, or other operator channels.

## Webhook bridge added in this repo

PUSPA now supports optional outbound webhook delivery for these events:

- `case_created`
- `case_status_changed`
- `donation_recorded`
- `donation_received`
- `donation_status_changed`
- `disbursement_created`
- `disbursement_status_changed`
- `disbursement_completed`
- `capture_created` (Memos/Capture)
- `capture_converted` (Memos/Capture)

Environment variables:

```env
PUSPA_OPENCLAW_WEBHOOK_ENABLED=true
PUSPA_OPENCLAW_WEBHOOK_URL=https://your-gateway.example.com/plugins/webhooks/puspa
PUSPA_OPENCLAW_WEBHOOK_SECRET=replace-with-strong-shared-secret
```

## Example OpenClaw webhooks plugin config

Based on the OpenClaw docs (`plugins/webhooks.md`):

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            puspa: {
              path: "/plugins/webhooks/puspa",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "PUSPA_WEBHOOK_SECRET"
              },
              controllerId: "webhooks/puspa",
              description: "PUSPA ops event bridge"
            }
          }
        }
      }
    }
  }
}
```

## Suggested first automations in OpenClaw

1. `case_created`
   - announce new intake to Telegram ops chat
2. `case_status_changed`
   - notify when case becomes `approved`, `rejected`, or `follow_up`
3. `donation_received`
   - send finance alert with donor + amount
4. `disbursement_completed`
   - send internal confirmation summary

## Dedicated Telegram lane for PUSPA

Recommended setup: keep the main NiagaBot Telegram bot untouched, then add a second Telegram account in OpenClaw for a PUSPA-specific bot such as `PuspaCareBot`.

Suggested account id:

```json5
{
  channels: {
    telegram: {
      accounts: {
        "puspa-care": {
          enabled: true,
          dmPolicy: "allowlist",
          groupPolicy: "allowlist",
          allowFrom: ["6798585537"],
          botToken: {
            source: "env",
            provider: "default",
            id: "PUSPA_CARE_BOT_TOKEN"
          },
          defaultTo: "6798585537"
        }
      }
    }
  }
}
```

Why this split helps:
- PUSPA notifications stay branded and isolated
- existing NiagaBot operator bot keeps running without disruption
- outbound notifications can explicitly target `accountId: "puspa-care"`

## Recommended event delivery shape

Use the existing PUSPA webhook route for app -> OpenClaw delivery, then let OpenClaw fan out to Telegram via the dedicated account.

Recommended production env pairing:

```env
# In PUSPA deployment env
PUSPA_OPENCLAW_WEBHOOK_ENABLED=true
PUSPA_OPENCLAW_WEBHOOK_URL=https://operator.gangniaga.my/plugins/webhooks/puspa
PUSPA_OPENCLAW_WEBHOOK_SECRET=shared-secret-with-openclaw

# Optional direct Telegram notification lane from PUSPA itself
PUSPA_TELEGRAM_ENABLED=true
PUSPA_TELEGRAM_BOT_TOKEN=telegram-bot-token
PUSPA_TELEGRAM_CHAT_ID=telegram-chat-id
```

## Practical rollout note

Today’s working rollout path is:
- OpenClaw holds a dedicated Telegram account id: `puspa-care`
- PUSPA can also send direct Telegram ops alerts with `PUSPA_TELEGRAM_*` env vars
- keep secrets in deployment secret manager, not in git

## Important note

Do **not** make PUSPA a full OpenClaw control panel.

Best separation:
- PUSPA = NGO application, records, workflow, UI
- OpenClaw = automation, channel messaging, agent tasks, scheduled follow-up, browser ops
