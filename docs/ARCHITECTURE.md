# ARCHITECTURE — Senibina Sistem

## PUSPA + OpenClaw Integrated Platform

> **Versi**: 1.0.0
> **Tarikh**: Julai 2025
> **Status**: Active
> **Dokumen**: Dikemaskini terakhir — Julai 2025

---

## 1. Overview Senibina

### 1.1 Prinsip Reka Bentuk

| Prinsip | Penerangan |
|---|---|
| **Single-Page Application** | Satu route (`/`) dengan tab-based navigation — tiada page transitions |
| **Modular Components** | Setiap modul diisolasi dalam folder terpisah (`puspa/`, `openclaw/`) |
| **API-First** | Semua data access melalui REST API routes — tiada direct Prisma calls dari client |
| **Hydration Safety** | `useSyncExternalStore` pattern untuk mengelakkan hydration mismatch |
| **Progressive Enhancement** | Core NGO modules berfungsi tanpa OpenClaw — AI features adalah enhancement |
| **Convention over Configuration** | shadcn/ui + Tailwind CSS untuk konsistensi tanpa custom design tokens |

### 1.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js App Router                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │  page.tsx    │  │  layout.tsx  │  │  globals.css     │  │   │
│  │  │  (SPA Tabs)  │  │  (Fonts,     │  │  (Theme,         │  │   │
│  │  │              │  │   Theme)     │  │   Tailwind 4)    │  │   │
│  │  └──────┬───────┘  └──────────────┘  └──────────────────┘  │   │
│  │         │                                                    │   │
│  │  ┌──────┴───────────────────────────────────────────────┐   │   │
│  │  │              Component Layer                          │   │   │
│  │  │  ┌─────────────────┐  ┌────────────────────────────┐ │   │   │
│  │  │  │  PUSPA Modules  │  │  OpenClaw Modules          │ │   │   │
│  │  │  │  • Dashboard    │  │  • MCP Servers             │ │   │   │
│  │  │  │  • Members      │  │  • Plugins                 │ │   │   │
│  │  │  │  • Programmes   │  │  • Integrations            │ │   │   │
│  │  │  │  • Donations    │  │  • Terminal                │ │   │   │
│  │  │  │  • Activities   │  │  • Agents                  │ │   │   │
│  │  │  │  • AI Report    │  │  • Models                  │ │   │   │
│  │  │  │  • Chat AI      │  │  • Automation              │ │   │   │
│  │  │  │  • Member Tools │  │                            │ │   │   │
│  │  │  │  • Admin        │  │                            │ │   │   │
│  │  │  └────────┬────────┘  └─────────────┬──────────────┘ │   │   │
│  │  └───────────┼──────────────────────────┼────────────────┘   │   │
│  │              │                          │                    │   │
│  │  ┌───────────┴──────────┐  ┌───────────┴──────────────┐    │   │
│  │  │  State Management    │  │  UI Components           │    │   │
│  │  │  ┌────────────────┐  │  │  ┌──────────────────┐   │    │   │
│  │  │  │  Zustand Store │  │  │  │  shadcn/ui (50+)  │   │    │   │
│  │  │  │  (OpenClaw)    │  │  │  │  • Button, Card   │   │    │   │
│  │  │  │  • MCPServers  │  │  │  │  • Dialog, Sheet  │   │    │   │
│  │  │  │  • Plugins     │  │  │  │  • Table, Tabs    │   │    │   │
│  │  │  │  • Agents      │  │  │  │  • Select, Input  │   │    │   │
│  │  │  │  • System      │  │  │  │  • Toast, Badge   │   │    │   │
│  │  │  └────────────────┘  │  │  └──────────────────┘   │    │   │
│  │  │  ┌────────────────┐  │  │  ┌──────────────────┐   │    │   │
│  │  │  │  localStorage  │  │  │  │  Framer Motion   │   │    │   │
│  │  │  │  (Chat, Report│  │  │  │  Recharts        │   │    │   │
│  │  │  │   History)    │  │  │  │  @dnd-kit        │   │    │   │
│  │  │  └────────────────┘  │  │  └──────────────────┘   │    │   │
│  │  └──────────────────────┘  └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │                              │
          │  fetch('/api/...')          │  useOpenClawStore()
          ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER (Next.js API Routes)                     │
│                                                                     │
│  ┌──────────────────────────────┐  ┌────────────────────────────┐  │
│  │  PUSPA API Routes           │  │  OpenClaw API Routes       │  │
│  │  (Database CRUD)            │  │  (AI-Powered)              │  │
│  │                              │  │                            │  │
│  │  • GET /api/stats            │  │  • POST /api/chat          │  │
│  │  • CRUD /api/members         │  │  • POST /api/report        │  │
│  │  • CRUD /api/programmes      │  │  • POST /api/members/      │  │
│  │  • CRUD /api/donations       │  │    tools/eligibility       │  │
│  │  • GET /api/activities       │  │  • POST /api/members/      │  │
│  │  • POST /api/seed            │  │    tools/aid-calculator    │  │
│  │  • Member Tools API          │  │                            │  │
│  │    - Communication logs      │  │  External:                 │  │
│  │    - Welfare assessments     │  │  ┌────────────────────┐   │  │
│  │    - Aid calculations        │  │  │  z-ai-web-dev-sdk   │   │  │
│  └──────────┬───────────────────┘  │  │  • DeepSeek Chat    │   │  │
│             │                      │  │  • LLM Completion  │   │  │
│             ▼                      │  └────────────────────┘   │  │
│  ┌──────────────────────────┐      └────────────────────────────┘  │
│  │  Prisma ORM              │                                      │
│  │  ┌────────────────────┐  │                                      │
│  │  │  Prisma Client     │  │                                      │
│  │  │  (Singleton)       │  │                                      │
│  │  └────────┬───────────┘  │                                      │
│  └───────────┼──────────────┘                                      │
│              ▼                                                     │
│  ┌──────────────────────────┐                                      │
│  │  SQLite Database         │                                      │
│  │  (file:../db/puspa.db)   │                                      │
│  │                          │                                      │
│  │  Tables:                 │                                      │
│  │  • Member                │                                      │
│  │  • Programme             │                                      │
│  │  • Donation              │                                      │
│  │  • Activity              │                                      │
│  │  • ProgrammeMember       │                                      │
│  │  • WelfareAssessment     │                                      │
│  │  • CommunicationLog      │                                      │
│  └──────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Senibina Frontend

### 2.1 Routing Strategy

```
Single-Page Architecture (No Multi-Page Routing)
─────────────────────────────────────────────────

User visits / → page.tsx renders → Tab-based SPA

Tab Navigation:
┌──────────────────────────────────────────────────────────┐
│ [Dashboard] [Ahli] [Program] [Donasi] ... | 🦞 [MCP] [Plugins] ... │
└──────────────────────────────────────────────────────────┘
       │                                                    │
       ▼                                                    ▼
  useState<TabId>('dashboard')                     useState<TabId>('mcp-servers')
       │                                                    │
       ▼                                                    ▼
  TabContent({tabId: 'dashboard'})                  TabContent({tabId: 'mcp-servers'})
       │                                                    │
       ▼                                                    ▼
  <DashboardTab />                                <MCPServersContent />
```

**Keputusan Arkitektur**: Menggunakan SPA tabs berbanding multi-page routing kerana:
1. Pengalaman pengguna yang lebih pantas (tiada page reload)
2. State persistence antara tabs
3. Animasi transisi yang smooth (Framer Motion)
4. Command palette boleh navigate ke mana-mana tab
5. Lebih sesuai untuk dashboard application

### 2.2 Component Architecture

```
src/components/
├── puspa/                    # NGO Core Modules
│   ├── dashboard-tab.tsx     # Dashboard overview
│   ├── members-tab.tsx       # Member CRUD (table + card dual layout)
│   ├── programmes-tab.tsx    # Programme CRUD (card grid)
│   ├── donations-tab.tsx     # Donation CRUD (table + summary cards)
│   ├── activities-kanban.tsx # Kanban board (@dnd-kit)
│   ├── ai-report-tab.tsx     # AI report generator
│   ├── chat-tab.tsx          # AI chatbot (Web Speech API)
│   ├── member-tools-tab.tsx  # 4 analytical tools
│   ├── admin-tab.tsx         # Static organization info
│   ├── notification-bell.tsx # Notification dropdown
│   ├── command-palette.tsx   # Ctrl+K command palette
│   └── data-export.tsx       # Data export utility
│
├── openclaw/                 # OpenClaw AI Platform Modules
│   ├── mcp-servers-content.tsx  # MCP server CRUD
│   ├── plugins-content.tsx      # Plugin marketplace
│   ├── integrations-content.tsx # 17 integration templates
│   ├── terminal-content.tsx     # Terminal emulator
│   ├── agents-content.tsx       # Agent management
│   ├── models-content.tsx       # Model provider config
│   ├── automation-content.tsx   # Task scheduling
│   └── dashboard-content.tsx    # OpenClaw system overview
│
├── ui/                       # shadcn/ui (50+ components)
│   ├── button.tsx, card.tsx, dialog.tsx, ...
│
└── theme-provider.tsx        # next-themes wrapper
```

### 2.3 State Management

```
┌─────────────────────────────────────────────────────┐
│                STATE MANAGEMENT                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Zustand Store (openclaw-store.ts)            │  │
│  │                                               │  │
│  │  State:                                       │  │
│  │  • mcpServers: MCPServer[]                   │  │
│  │  • plugins: Plugin[]                         │  │
│  │  • integrations: Integration[]               │  │
│  │  • terminal: { lines, commandHistory, ... }  │  │
│  │  • agents: Agent[]                           │  │
│  │  • modelProviders: ModelProvider[]           │  │
│  │  • system: { gatewayStatus, uptime, ... }    │  │
│  │                                               │  │
│  │  Actions:                                     │  │
│  │  • add/update/remove/toggle per entity       │  │
│  │  • Terminal command processing               │  │
│  │  • System status management                  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Component Local State (useState)             │  │
│  │                                               │  │
│  │  PUSPA modules:                               │  │
│  │  • activeTab (page.tsx)                       │  │
│  │  • members[], searchTerm, filters             │  │
│  │  • programmes[], form state                   │  │
│  │  • donations[], summary data                  │  │
│  │  • activities[], kanban columns               │  │
│  │                                               │  │
│  │  OpenClaw modules:                            │  │
│  │  • Local UI state (dialogs, sheets)           │  │
│  │  • Form data (MCP server, agent config)      │  │
│  │  • Automation tasks (local mock)              │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  Browser Storage (localStorage)               │  │
│  │                                               │  │
│  │  • chatMessages (max 50)                      │  │
│  │  • reportHistory (max 5)                      │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Keputusan Arkitektur**:
- **Zustand** dipilih berbanding Redux/Context kerana: lebih ringan, API yang simpler, tiada provider wrapper, baik untuk medium-scale state
- **localStorage** untuk persistence yang tidak kritikal (chat history, report history) — tidak perlu database
- **Component local state** untuk UI-only state yang tidak dikongsi

### 2.4 Hydration Strategy

```tsx
// Anti-hydration-mismatch pattern
const subscribe = () => () => {};
const getSnapshot = () => true;       // Client: true
const getServerSnapshot = () => false; // Server: false
const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

if (!isClient) {
  return <LoadingSkeleton />; // Server renders skeleton
}
// Client renders full interactive UI
```

**Mengapa**: Next.js App Router dengan `'use client'` masih melakukan SSR. Tanpa pattern ini, interactive components boleh cause hydration mismatch kerana browser APIs (localStorage, SpeechRecognition, etc.) tidak available semasa SSR.

---

## 3. Senibina Backend

### 3.1 API Route Structure

```
src/app/api/
│
├── stats/route.ts              GET     Dashboard statistics
│
├── members/
│   ├── route.ts                GET     List members (search, filter, paginate, sort)
│   │                           POST    Create member (IC uniqueness check)
│   └── [id]/route.ts           GET     Get member detail (with donations, programmes)
│                               PUT     Update member (partial)
│                               DELETE  Delete member (cascade)
│
├── programmes/
│   ├── route.ts                GET     List programmes (search, filter, paginate)
│   │                           POST    Create programme
│   └── [id]/route.ts           GET/PUT/DELETE
│
├── donations/
│   ├── route.ts                GET     List donations + summary (search, filter, paginate)
│   │                           POST    Create donation (FK validation)
│   └── [id]/route.ts           GET/PUT/DELETE
│
├── activities/route.ts         GET     List activities (search, filter, paginate)
│
├── seed/route.ts               POST    Seed database (29 members, 8 programmes, etc.)
│
├── chat/route.ts               POST    AI chat (DeepSeek via z-ai-web-dev-sdk)
│
├── report/route.ts             POST    AI report generator (5 types)
│
└── members/tools/
    ├── aid-calculator/route.ts POST    BMT formula calculation (pure math)
    ├── communication/route.ts  GET/POST Communication log CRUD
    ├── eligibility/route.ts    POST    AI eligibility check (member + AI)
    └── welfare/route.ts        GET/POST Welfare assessment CRUD
```

### 3.2 API Response Format

```typescript
// Standard success response (collection)
{
  data: T[],                    // Array of items
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Standard success response (single item)
{
  data: T                       // Single item
}

// Error response
{
  error: string,                // Error message
  details?: any                 // Optional error details
}

// Donations special (includes summary)
{
  donations: Donation[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
  summary: {
    totalDonations: number,
    thisMonthDonations: number,
    totalDonors: number
  }
}
```

### 3.3 Database Schema (ER Diagram)

```
┌──────────────────┐       ┌──────────────────┐
│     Member       │       │    Programme     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name             │       │ name             │
│ icNumber (UNIQUE)│       │ description      │
│ phone            │       │ category         │
│ email            │       │ status           │
│ address          │       │ startDate        │
│ category         │       │ endDate          │
│ status           │       │ location         │
│ joinDate         │       │ beneficiaryCount │
│ familyMembers    │       │ volunteerCount   │
│ monthlyIncome    │       │ budget           │
│ notes            │       │ actualCost       │
│ avatar           │       │ partners (JSON)  │
│ createdAt        │       │ notes            │
│ updatedAt        │       │ createdAt        │
└────────┬─────────┘       │ updatedAt        │
         │                 └────────┬─────────┘
         │                          │
    ┌────┼──────────────────────────┼──────────┐
    │    │                          │          │
    │    │    ┌─────────────────┐   │    ┌─────┴──────────┐
    │    │    │ProgrammeMember │   │    │   Donation     │
    │    │    ├─────────────────┤   │    ├────────────────┤
    │    │    │ id (PK)         │   │    │ id (PK)        │
    │    │    │ programmeId (FK)├───┘    │ donorName      │
    │    │    │ memberId (FK)   ├───┐    │ amount         │
    │    │    │ role            │   │    │ method         │
    │    │    │ status          │   │    │ status         │
    │    │    │ joinedAt        │   │    │ receiptNumber  │
    │    │    │ notes           │   │    │ date           │
    │    │    └─────────────────┘   │    │ programmeId(FK)├──┘
    │    │                          │    │ memberId (FK)  ├──┐
    │    │                          │    │ notes          │  │
    │    │                          │    │ createdAt      │  │
    │    │                          │    │ updatedAt      │  │
    │    │                          │    └────────────────┘  │
    │    │                                                 │
    │    │    ┌──────────────────┐    ┌──────────────────┐  │
    │    │    │WelfareAssessment │    │CommunicationLog  │  │
    │    │    ├──────────────────┤    ├──────────────────┤  │
    │    │    │ id (PK)          │    │ id (PK)          │  │
    │    │    │ memberId (FK)    │    │ memberId (FK)    │  │
    │    │    │ foodSecurity     │    │ type             │  │
    │    │    │ education        │    │ summary          │  │
    │    │    │ healthcare       │    │ followUpNeeded   │  │
    │    │    │ financial        │    │ followUpDate     │  │
    │    │    │ housing          │    │ priority         │  │
    │    │    │ overallScore     │    │ conductedBy      │  │
    │    │    │ notes            │    │ createdAt        │  │
    │    │    │ assessedBy       │    │ updatedAt        │  │
    │    │    │ assessedAt       │    └──────────────────┘  │
    │    │    │ createdAt        │                          │
    │    │    │ updatedAt        │                          │
    │    │    └──────────────────┘                          │
    │    │                                                 │
    │    └──────────────────── All FK cascade on delete ────┘
    │
    └───────────────────── IC unique constraint ──────────────
```

### 3.4 Prisma Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"          # Local: SQLite
  url      = "file:../db/puspa.db"
  // Production: provider = "postgresql" + Supabase URL
}
```

**Keputusan Arkitektur**:
- **SQLite untuk local dev** — zero-config, file-based, mudah backup
- **Supabase PostgreSQL untuk production** — scalable, managed, real-time capable
- **Prisma singleton pattern** — mengelakkan connection pool exhaustion:
  ```typescript
  // src/lib/db.ts
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  export const db = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
  ```

---

## 4. Integrasi AI

### 4.1 AI Service Architecture

```
┌─────────────────────────────────────────────────┐
│                  AI Layer                        │
│                                                   │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  z-ai-web-   │  │  AI-Powered API Routes  │  │
│  │  dev-sdk     │  │                          │  │
│  │              │  │  /api/chat               │  │
│  │  ┌────────┐  │  │  ├─ DeepSeek Chat       │  │
│  │  │DeepSeek│  │  │  ├─ PUSPA system prompt │  │
│  │  │Chat    │  │  │  └─ Malay language      │  │
│  │  └────────┘  │  │                          │  │
│  │              │  │  /api/report              │  │
│  │  ┌────────┐  │  │  ├─ DeepSeek Chat       │  │
│  │  │LLM     │  │  │  ├─ DB queries          │  │
│  │  │Complet.│  │  │  ├─ 5 report types      │  │
│  │  └────────┘  │  │  └─ Markdown output     │  │
│  │              │  │                          │  │
│  │              │  │  /api/members/tools/     │  │
│  │              │  │  eligibility             │  │
│  │              │  │  ├─ DeepSeek (temp 0.3)  │  │
│  │              │  │  ├─ Member + Programme   │  │
│  │              │  │  └─ Match score > 40%    │  │
│  └──────────────┘  └─────────────────────────┘  │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Pure Calculation (No AI)                  │  │
│  │                                            │  │
│  │  /api/members/tools/aid-calculator         │  │
│  │  ├─ BMT Formula                           │  │
│  │  ├─ Poverty line RM2,960                   │  │
│  │  └─ Category/special needs adjustment     │  │
│  └────────────────────────────────────────────┘  │
│                                                   │
│  ┌────────────────────────────────────────────┐  │
│  │  Client-Side AI                            │  │
│  │                                            │  │
│  │  Web Speech API (chat-tab.tsx)             │  │
│  │  ├─ SpeechRecognition (ms-MY)              │  │
│  │  └─ SpeechSynthesis (Malay voice)          │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### 4.2 AI Prompt Strategy

```
Chat AI System Prompt:
─────────────────────
Kamu adalah pembantu maya PUSPA (Pertubuhan Urus Peduli Asnaf).
Jawab dalam Bahasa Melayu. Berikan maklumat tentang:
- Pengurusan ahli (asnaf, sukarelawan, penderma)
- Program kebajikan (food-aid, education, skills, healthcare)
- Sumbangan dan kewangan
- Aktiviti pertubuhan

Report AI System Prompt:
───────────────────────
Kamu adalah penulis laporan profesional untuk PUSPA.
Jana laporan komprehensif dalam Bahasa Melayu, format Markdown.
Sertakan: ringkasan eksekutif, statistik, analisis, cadangan.
Sumber data disediakan dari database pertubuhan.

Eligibility AI System Prompt:
─────────────────────────────
Berdasarkan profil ahli dan senarai program aktif, tentukan
kelayakan. Berikan match score (%) dan reason. Hanya return
program dengan score > 40%.
```

---

## 5. Tema & Styling

### 5.1 CSS Custom Properties

```css
/* Light Mode - PUSPA Purple Theme */
:root {
  --background: oklch(0.985 0.002 300);      /* Off-white with purple tint */
  --foreground: oklch(0.145 0.015 300);      /* Deep purple-black */
  --primary: oklch(0.55 0.24 300);           /* PUSPA Purple */
  --primary-foreground: oklch(1 0 0);        /* White on purple */
  --secondary: oklch(0.95 0.02 300);         /* Light purple */
  --accent: oklch(0.94 0.03 300);            /* Accent purple */
  --muted: oklch(0.96 0.008 300);            /* Muted background */
  --destructive: oklch(0.577 0.245 27.325);  /* Red for errors */
  --border: oklch(0.9 0.012 300);            /* Purple-tinted border */
  --ring: oklch(0.55 0.24 300);              /* Focus ring */
  --chart-1 to --chart-5: Purple-based chart colors
}

/* Dark Mode */
.dark {
  --background: oklch(0.13 0.015 300);
  --foreground: oklch(0.96 0.008 300);
  --primary: oklch(0.65 0.25 300);
  /* ... full dark theme */
}

/* OpenClaw Theme (inline, not CSS variable) */
/* oklch(0.55 0.22 25) — Reddish-brown accent */
/* oklch(0.7 0.18 25)  — Lighter variant for dark mode */
```

### 5.2 Typography System

```css
--font-poppins: Poppins;        /* Headings - weights 300-800 */
--font-inter: Inter;            /* Body text - default */
--font-geist-mono: JetBrains Mono; /* Code, terminal */
```

---

## 6. Keputusan Teknikal & Trade-offs

### 6.1 Keputusan yang Diambil

| Keputusan | Pilihan | Alternatif yang Dipertimbangkan | Justifikasi |
|---|---|---|---|
| Framework | Next.js 16 (App Router) | Remix, SvelteKit | Ecosystem terbesar, Vercel deployment, RSC support |
| UI Library | shadcn/ui | MUI, Chakra, Headless UI | Customizable, no runtime overhead, modern design |
| ORM | Prisma | Drizzle, Kysely, raw SQL | Type-safe, migrations, studio GUI |
| State Mgmt | Zustand | Redux Toolkit, Jotai, Context | Simple API, performant, selective subscriptions |
| Styling | Tailwind CSS 4 | CSS Modules, Emotion, Styled | Utility-first, no context switching |
| DB (local) | SQLite | PostgreSQL, MySQL | Zero-config, file-based, fast |
| DB (prod) | Supabase PostgreSQL | PlanetScale, Neon | Free tier, real-time, auth included |
| AI SDK | z-ai-web-dev-sdk | OpenAI SDK, LangChain | Pre-configured, multi-model, built-in features |
| Animations | Framer Motion | GSAP, CSS transitions | React-native, layout animations, AnimatePresence |
| DnD | @dnd-kit | react-beautiful-dnd | Modern, accessible, maintained |
| Form | react-hook-form + Zod | Formik, native | Small bundle, great DX, type-safe validation |

### 6.2 Trade-offs

| Trade-off | Kelebihan | Kelemahan |
|---|---|---|
| SPA tabs vs Multi-page | UX lebih smooth, state persistence | SEO kurang baik, initial bundle lebih besar |
| Mock data (OpenClaw) | Rapid prototyping, demo-ready | Tiada real functionality |
| SQLite local | Zero setup, fast | Tiada real-time, limited concurrency |
| No authentication (currently) | Faster development | Security risk untuk production |
| localStorage persistence | Simple, no backend needed | Limited storage (5MB), sync issues |

---

## 7. Performance Considerations

### 7.1 Bundle Optimization

- **shadcn/ui**: Tree-shakeable, hanya import komponen yang digunakan
- **Dynamic imports**: Potentially lazy-load OpenClaw tabs
- **Image optimization**: `next/image` for PUSPA logo
- **Font optimization**: `next/font/google` with `display: swap`

### 7.2 Data Fetching Strategy

```
┌──────────────────────────────────────────────────┐
│  Tab Activation → fetch() → Loading State        │
│                                                   │
│  • useEffect dengan cancellation flag             │
│  • AbortController untuk cleanup                  │
│  • isInitialLoading vs isLoading (skeleton/spinner)│
│  • Error state dengan retry button                │
│                                                   │
│  Optimization Opportunities:                      │
│  • React Query / SWR untuk caching               │
│  • Parallel fetching untuk related data           │
│  • Optimistic updates untuk CRUD                  │
│  • Infinite scroll untuk large datasets           │
└──────────────────────────────────────────────────┘
```

### 7.3 Known Performance Bottlenecks

1. **Initial page load**: Semua 17 komponen di-import, walaupun hanya 1 ditampilkan
   - **Mitigation**: Dynamic import dengan `next/dynamic`
2. **Dashboard stats**: 5 parallel DB queries setiap kali dashboard dibuka
   - **Mitigation**: Caching layer (React Query)
3. **AI report generation**: Tunggu AI response (5-15 saat)
   - **Mitigation**: Streaming response, loading animation
4. **Chat history**: localStorage baca/tulis setiap mesej
   - **Mitigation**: Debounced saves

---

## 8. Security Considerations

### 8.1 Current Security Posture

| Aspect | Status | Notes |
|---|---|---|
| Authentication | ❌ Not implemented | Open route untuk semua |
| Authorization | ❌ Not implemented | Tiada role checking |
| Input Validation | ✅ Partial | Zod di forms, basic checks di API |
| SQL Injection | ✅ Protected | Prisma ORM parameterized queries |
| XSS | ✅ Partial | React auto-escape, tapi markdown rendering perlu sanitize |
| CSRF | ⚠️ Partial | SameSite cookies, tapi tiada token |
| Rate Limiting | ❌ Not implemented | AI routes vulnerable |
| Data Encryption | ⚠️ Partial | HTTPS (Vercel), tapi DB plaintext |

### 8.2 Recommendations for Production

1. Implement NextAuth.js v4 dengan credential + OAuth providers
2. Role-based access control (Admin, Officer, Volunteer, Asnaf)
3. API rate limiting middleware (especially AI routes)
4. Input sanitization untuk markdown rendering (DOMPurify)
5. Audit logging untuk semua CRUD operations
6. Environment variable secrets management (Vercel Vault)
7. Regular dependency audit (`npm audit`)

---

## 9. Deployment Architecture

### 9.1 Current: Vercel

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│   Browser       │─────▶│  Vercel Edge     │─────▶│  Next.js App  │
│   (Client)      │      │  CDN + SSR       │      │  (Serverless) │
└─────────────────┘      └──────────────────┘      └───────┬───────┘
                                                          │
                                                   ┌──────┴───────┐
                                                   │  Supabase    │
                                                   │  PostgreSQL  │
                                                   │  (Production)│
                                                   └──────────────┘
```

### 9.2 Recommended: Self-Hosted with Docker

```
┌──────────────┐     ┌──────────────┐     ┌────────────────────────┐
│   Browser    │────▶│  Nginx/Caddy │────▶│  Docker Compose        │
│              │     │  (Reverse    │     │                        │
│              │     │   Proxy +    │     │  ┌──────────────────┐  │
│              │     │   SSL)       │     │  │  Next.js App     │  │
│              │     │              │     │  │  (Port 3000)     │  │
│              │     │              │     │  └────────┬─────────┘  │
│              │     │              │     │           │            │
│              │     │              │     │  ┌────────┴─────────┐  │
│              │     │              │     │  │  PostgreSQL      │  │
│              │     │              │     │  │  (Port 5432)     │  │
│              │     │              │     │  └──────────────────┘  │
│              │     │              │     │                        │
│              │     │              │     │  ┌──────────────────┐  │
│              │     │              │     │  │  Redis (Cache)   │  │
│              │     │              │     │  │  (Port 6379)     │  │
│              │     │              │     │  └──────────────────┘  │
│              │     │              │     └────────────────────────┘
└──────────────┘     └──────────────┘
```

---

* Dokumen ini dikemaskini secara berkala. Sila rujuk CHANGELOG.md untuk sejarah perubahan.
