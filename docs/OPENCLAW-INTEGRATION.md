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

## Important note

Do **not** make PUSPA a full OpenClaw control panel.

Best separation:
- PUSPA = NGO application, records, workflow, UI
- OpenClaw = automation, channel messaging, agent tasks, scheduled follow-up, browser ops
