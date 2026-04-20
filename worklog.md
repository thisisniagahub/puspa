---
Task ID: 1
Agent: Main
Task: Review docs.openclaw.ai and build OpenClaw AI Agent Platform with MCP Servers, Plugins, Integrations, Terminal

Work Log:
- Read and analyzed docs.openclaw.ai (main page, MCP docs, bundles docs, channels docs, models docs, multi-agent docs, apply_patch tool docs)
- Identified all OpenClaw features: 20+ chat channels, MCP server/client, multi-agent routing, 40+ model providers, plugin system (native + bundles from Codex/Claude/Cursor), skills system, terminal, automation, webhooks, gateway architecture
- Created comprehensive Zustand store with 8 slices (navigation, MCP servers, plugins, integrations, terminal, agents, models, system) with realistic mock data
- Built main page layout with dark sidebar navigation, responsive mobile drawer, top header with system metrics
- Built 8 feature components: Dashboard, MCP Servers, Plugins, Integrations, Terminal, Agents, Models, Automation
- Applied OpenClaw orange/claw theme (oklch colors), dark sidebar gradient, glass morphism effects
- Fixed all ESLint errors (0 errors, 0 warnings)
- Verified page loads with HTTP 200

Stage Summary:
- Full OpenClaw-inspired management platform built at / route
- 8 sections: Dashboard, MCP Servers, Plugins & Skills, Integrations, Terminal, Agents, Models, Automation
- Key features per section:
  - Dashboard: Stats grid, gateway status, activity feed, quick actions, model health
  - MCP Servers: Server cards with transport types, add/edit dialog with STDIO/SSE/HTTP config, test connection
  - Plugins: Filter chips, plugin grid, install dialog with marketplace, configure sheet, source badges (OpenClaw/Codex/Claude/Cursor)
  - Integrations: Category tabs (Chat/Models/Webhooks/Storage), configure sheets, quick connect for unconfigured
  - Terminal: Full terminal emulator with command history, 10+ built-in commands, side panel
  - Agents: Agent cards, configuration sheet with SOUL.md, model selector, channel bindings, skill allowlist, routing rules
  - Models: Provider cards, failover chain, specialized model settings, allowlist, provider directory (24 providers)
  - Automation: 4 sub-tabs (Scheduled/Background/Standing Orders/Webhooks), create dialogs
- Dev server running at localhost:3000, page returns 200 OK
