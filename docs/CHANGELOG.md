# CHANGELOG — Log Perubahan

## PUSPA Operations App

> Format berdasarkan [Keep a Changelog](https://keepachangelog.com/)

---

## [1.1.0] — 2026-04-21

### Added
- Premium login screen refresh with stronger motion, trust messaging, and improved operator-facing hierarchy.
- Case intelligence surfaces in the case workflow, including next action guidance, beneficiary 360 summary, risk flags, related cases, recommendations, and quick signals.
- Disbursement readiness and reconciliation signals for payout operators.
- PUSPA outbound OpenClaw webhook bridge for ops events.
- Optional direct Telegram notification lane from PUSPA for ops alerts.

### Changed
- Product direction clarified: PUSPA remains the core NGO operations app, while OpenClaw is treated as the automation and messaging layer.
- Documentation refreshed to better match the current route-based app structure and `v1` API reality.
- Login experience upgraded from utilitarian auth card to a more polished, preview-ready entrance experience.

### Fixed
- Removed stale positioning in docs that implied OpenClaw was the primary in-app control surface.
- Removed outdated references to public-open auth assumptions in current API docs.

## [1.0.0] — 2025-07-15

### Added — PUSPA Core Modules

- **Dashboard** (`dashboard-tab.tsx`)
  - 4 stat cards (Total Ahli Asnaf, Program Aktif, Total Donasi, Sukarelawan Aktif)
  - Carta bar sumbangan bulanan (12 bulan, Recharts)
  - Carta donut pecahan ahli mengikut kategori
  - Feed aktiviti terkini (5 items)
  - Quick stats summary row
  - Beneficiary highlight banner
  - Loading skeleton, error state dengan retry

- **Pengurusan Ahli** (`members-tab.tsx`)
  - CRUD sepenuhnya (Create, Read, Update, Delete)
  - Table view (desktop) dan card view (mobile)
  - Search, filter (kategori, status), pagination, sort
  - Form dialog dengan validasi Zod + react-hook-form
  - View member detail dengan related donations & programmes
  - IC uniqueness check (409 conflict)
  - Badge system untuk kategori dan status

- **Pengurusan Program** (`programmes-tab.tsx`)
  - CRUD sepenuhnya
  - Card grid layout (responsive 1/2/3 columns)
  - 6 kategori: food-aid, education, skills, healthcare, financial, community
  - 4 status: active, completed, upcoming, cancelled
  - Budget progress bar dengan over-budget detection
  - Partner tags (JSON/comma-separated parsing)

- **Pengurusan Donasi** (`donations-tab.tsx`)
  - CRUD sepenuhnya
  - 3 summary cards (Total, Bulan Ini, Jumlah Penderma)
  - Filter status (confirmed/pending/rejected) dan method (bank-transfer/cash/online/cheque)
  - Programme selector dropdown
  - Receipt number tracking
  - Pagination dengan format Bahasa Melayu

- **Aktiviti Kanban** (`activities-kanban.tsx`)
  - 4 lajur: Dirancang, Dalam Proses, Selesai, Dibatalkan
  - Drag-and-drop via @dnd-kit
  - Activity card dengan type badge dan color-coded left border
  - Round-robin initial status assignment

- **Alat AI** (`ai-report-tab.tsx`)
  - 4 jenis laporan: Ringkasan, Kewangan, Program, Demografi Ahli
  - Custom prompt textarea
  - Report history (localStorage, max 5)
  - Export: Copy, Print, Download .txt
  - Markdown rendering via ReactMarkdown

- **Chat AI** (`chat-tab.tsx`)
  - Chat interface dengan message bubbles
  - Speech-to-Text input (ms-MY)
  - Text-to-Speech output (Malay voice)
  - Quick questions suggestions
  - Chat history (localStorage, max 50)
  - Typing indicator

- **Alat Ahli** (`member-tools-tab.tsx`)
  - AI Programme Eligibility checker
  - Kalkulator Bantuan Kewangan (formula BMT)
  - Penilaian Kebajikan (5 dimensi slider)
  - Log Komunikasi (CRUD)

- **Admin** (`admin-tab.tsx`)
  - Maklumat organisasi
  - Ahli lembaga (board members)
  - Portfolio program
  - Rakan strategik
  - Maklumat bank sumbangan + copy-to-clipboard

### Added — OpenClaw Integration Modules

- **MCP Servers** (`mcp-servers-content.tsx`)
  - CRUD untuk MCP server configurations
  - 3 transport types: STDIO, SSE, Streamable HTTP
  - Dynamic environment variables editor
  - Test Connection (simulated)
  - Enable/disable toggle per server

- **Plugins** (`plugins-content.tsx`)
  - Plugin marketplace dengan filter by source
  - Install dialog (3 methods: Directory, URL, Marketplace)
  - Configure slide-over panel
  - Stats bar

- **Integrations** (`integrations-content.tsx`)
  - 17 integration templates (Discord, Telegram, WhatsApp, Slack, Claude, GPT-4, etc.)
  - 4-category tab navigation
  - Configure sheet per integration
  - Test Connection

- **Terminal** (`terminal-content.tsx`)
  - Terminal emulator dengan macOS-style dots
  - 9 commands: help, status, version, mcp list, mcp serve, plugins list, agents list, models list, clear
  - Command history navigation (Arrow keys)
  - Side panel dengan session info

- **Agents** (`agents-content.tsx`)
  - Agent card management
  - Create & configure agent (model, personality, skills, channels, tools, MCP)
  - Agent routing diagram

- **Models** (`models-content.tsx`)
  - Model provider cards dengan latency & cost
  - Primary/failover chain configuration
  - Specialized model settings (Image, PDF, Video, Music)
  - 24-provider directory

- **Automation** (`automation-content.tsx`)
  - Scheduled tasks dengan cron support
  - Background task monitoring
  - Standing orders (event-triggered rules)
  - Webhook endpoint management

### Added — Cross-cutting Features

- **Command Palette** (`command-palette.tsx`) — Ctrl+K / Cmd+K navigation
- **Notification Bell** (`notification-bell.tsx`) — Gateway status notifications
- **Theme System** — PUSPA Purple theme dengan Dark/Light mode
- **Hydration Safety** — useSyncExternalStore pattern
- **Zustand Store** (`openclaw-store.ts`) — Comprehensive state for OpenClaw modules

### Added — API Routes

- `GET /api/stats` — Dashboard statistics
- `GET/POST /api/members` — Member collection
- `GET/PUT/DELETE /api/members/[id]` — Single member
- `GET/POST /api/programmes` — Programme collection
- `GET/PUT/DELETE /api/programmes/[id]` — Single programme
- `GET/POST /api/donations` — Donation collection + summary
- `GET/PUT/DELETE /api/donations/[id]` — Single donation
- `GET /api/activities` — Activity list (read-only)
- `POST /api/chat` — AI chat (DeepSeek)
- `POST /api/report` — AI report generator (5 types)
- `POST /api/seed` — Database seeder
- `POST /api/members/tools/aid-calculator` — BMT calculation
- `GET/POST /api/members/tools/communication` — Communication logs
- `POST /api/members/tools/eligibility` — AI eligibility check
- `GET/POST /api/members/tools/welfare` — Welfare assessments

### Added — Database Schema

- 7 Prisma models: Member, Programme, Donation, Activity, ProgrammeMember, WelfareAssessment, CommunicationLog
- SQLite for local development
- Comprehensive seeding data (29 members, 8 programmes, 15 donations, etc.)

### Added — Documentation

- `docs/README.md` — Comprehensive project overview
- `docs/PRD.md` — Product Requirements Document
- `docs/ARCHITECTURE.md` — System architecture
- `docs/DESIGN.md` — UI/UX design system
- `docs/API.md` — Complete API reference
- `docs/DEPLOYMENT.md` — Deployment guide
- `docs/CONTRIBUTING.md` — Contributor guidelines
- `docs/CHANGELOG.md` — This file

---

## [0.9.0] — 2025-07-10 (Historical)

### Added
- Initial PUSPA branding and logo
- Next.js 16 project scaffold
- shadcn/ui component library setup
- Prisma ORM with SQLite
- Basic dashboard with stats
- Member management (basic CRUD)
- Programme management
- Donation tracking
- Activity Kanban board

### Changed
- Switched from Supabase to SQLite for local development
- Updated branding to match official puspa.org.my

---

## [0.1.0] — 2025-07-01 (Historical)

### Added
- Project initialization
- GitHub repository setup
- Vercel deployment configuration
- Basic Next.js app structure

---

*Format: [Version] — Date*
*Categories: Added, Changed, Deprecated, Removed, Fixed, Security*
