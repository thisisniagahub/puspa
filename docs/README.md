# PUSPA - Pertubuhan Urus Peduli Asnaf

> Sistem Pengurusan NGO Kebajikan Islam dengan Integrasi OpenClaw AI Agent Platform

<p align="center">
  <img src="/puspa-logo-official.png" alt="PUSPA Logo" width="120" height="120" />
  <br />
  <strong>Pertubuhan Urus Peduli Asnaf</strong>
  <br />
  <em>Platform Pengurusan Komprehensif untuk NGO Kebajikan Islam</em>
</p>

---

## 📖 Deskripsi

**PUSPA** (Pertubuhan Urus Peduli Asnaf) ialah sistem pengurusan NGO komprehensif yang dibina untuk memperkemas operasi pertubuhan kebajikan Islam. Platform ini menggabungkan pengurusan ahli, program, sumbangan, aktiviti, dan alat AI dalam satu antarama yang mesra pengguna.

Platform ini juga mengintegrasikan **OpenClaw** — sebuah AI Agent Platform yang menyediakan keupayaan MCP Servers, Plugin marketplace, Integrations, Terminal, Multi-Agent orchestration, Model management, dan Automation.

## ✨ Ciri-ciri Utama

### 📊 Dashboard PUSPA (Modul Asas)

| Modul | Penerangan |
|---|---|
| **Dashboard** | Paparan overview organisasi dengan statistik masa nyata, carta sumbangan bulanan, pecahan ahli, dan aktiviti terkini |
| **Ahli** | Pengurusan ahli CRUD sepenuhnya — search, filter, pagination, profil terperinci, kategori (asnaf/sukarelawan/penderma/staf) |
| **Program** | Pengurusan program kebajikan — kad grid layout, bajet tracking, senarai ahli program, kemajuan bajet |
| **Donasi** | Pengurusan rekod sumbangan — ringkasan kewangan, filter status/kaedah, pagination, receipt tracking |
| **Aktiviti** | Papan Kanban drag-and-drop dengan 4 lajur status (Dirancang / Dalam Proses / Selesai / Dibatalkan) |
| **Alat AI** | Penjanaan laporan AI dengan 4 jenis (Ringkasan, Kewangan, Program, Ahli), prompt custom, dan eksport |
| **Chat AI** | Chatbot AI bercakap Bahasa Melayu dengan sokongan suara (Speech-to-Text & Text-to-Speech) |
| **Alat Ahli** | 4 alat analitik — Eligibiliti Program AI, Kalkulator Bantuan Kewangan, Penilaian Kebajikan, Log Komunikasi |
| **Admin** | Maklumat organisasi, ahli lembaga, portfolio program, rakan strategik, maklumat bank sumbangan |

### 🦞 Integrasi OpenClaw (Modul AI)

| Modul | Penerangan |
|---|---|
| **MCP Servers** | Pengurusan server Model Context Protocol — STDIO, SSE, Streamable HTTP, CRUD, test connection |
| **Plugins** | Marketplace plugin dari pelbagai sumber (OpenClaw, Codex, Claude, Cursor) dengan konfigurasi dan toggle |
| **Integrations** | 17+ integrasi template — Chat Channels, Model Providers, Webhooks, Storage |
| **Terminal** | Emulator terminal interaktif dengan 9 arahan, navigasi sejarah, dan paparan status masa nyata |
| **Agents** | Pengurusan AI agent instances — konfigurasi model, personality, skill allowlist, channel bindings, routing |
| **Models** | Konfigurasi model provider — primary/failover chain, specialized model routing, 24-provider directory |
| **Automation** | Penjadualan tugasan, monitoring tugasan latar belakang, standing orders, webhook management |

### 🔧 Ciri-ciri Teknikal

- **Hydration-safe rendering** dengan `useSyncExternalStore`
- **Command Palette** (Ctrl+K / Cmd+K) untuk navigasi pantas
- **Dark/Light Mode** dengan tema ungu PUSPA
- **Responsive Design** — mobile-first dengan dual layout (table vs card)
- **Real-time notifications** bell dengan status gateway
- **Zustand state management** untuk OpenClaw store
- **Web Speech API** untuk input/output suara Bahasa Melayu
- **Drag-and-Drop** Kanban board via @dnd-kit

## 🛠️ Teknologi

### Core Stack

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Next.js** | 16.1 | Framework utama (App Router, Turbopack) |
| **TypeScript** | 5 | Bahasa pengaturcaraan |
| **React** | 19 | UI library |
| **Tailwind CSS** | 4 | Styling framework |
| **shadcn/ui** | Latest | Component library (New York style) |
| **Prisma ORM** | 6.11 | Database ORM |
| **SQLite** | — | Local database |
| **Zustand** | 5 | Client state management |
| **Framer Motion** | 12 | Animasi & transitions |
| **Lucide React** | 0.525 | Icon library |
| **z-ai-web-dev-sdk** | 0.0.17 | AI capabilities (LLM, Chat) |

### Additional Libraries

- `@dnd-kit/core` + `@dnd-kit/sortable` — Drag-and-drop Kanban
- `@hookform/resolvers` + `react-hook-form` — Form management
- `zod` — Schema validation
- `react-markdown` + `@tailwindcss/typography` — Markdown rendering
- `recharts` — Data visualization charts
- `next-themes` — Theme switching
- `cmdk` — Command palette
- `sonner` — Toast notifications
- `date-fns` — Date formatting
- `@tanstack/react-table` — Table utilities
- `@mdxeditor/editor` — Rich text editing

## 📁 Struktur Projek

```
puspa/
├── prisma/
│   └── schema.prisma           # Database schema (7 models)
├── db/
│   └── puspa.db                # SQLite database file
├── public/
│   ├── puspa-logo-official.png
│   ├── puspa-logo-transparent.png
│   ├── puspa-hero.png
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (fonts, theme, metadata)
│   │   ├── page.tsx            # Single-page app (all tabs)
│   │   ├── globals.css         # Tailwind + theme variables (purple)
│   │   └── api/
│   │       ├── stats/route.ts
│   │       ├── members/route.ts
│   │       ├── members/[id]/route.ts
│   │       ├── programmes/route.ts
│   │       ├── programmes/[id]/route.ts
│   │       ├── donations/route.ts
│   │       ├── donations/[id]/route.ts
│   │       ├── activities/route.ts
│   │       ├── chat/route.ts
│   │       ├── report/route.ts
│   │       ├── seed/route.ts
│   │       └── members/tools/
│   │           ├── aid-calculator/route.ts
│   │           ├── communication/route.ts
│   │           ├── eligibility/route.ts
│   │           └── welfare/route.ts
│   ├── components/
│   │   ├── puspa/              # PUSPA modules (9 components)
│   │   ├── openclaw/           # OpenClaw modules (8 components)
│   │   ├── ui/                 # shadcn/ui components (50+)
│   │   └── theme-provider.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   └── utils.ts            # cn() utility
│   └── store/
│       └── openclaw-store.ts   # Zustand store for OpenClaw state
├── docs/                        # Documentation
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── CHANGELOG.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **Bun** >= 1.0 (recommended) atau npm/yarn
- **Git**

### Installation

```bash
# Clone repository
git clone https://github.com/thisisniagahub/puspa.git
cd puspa

# Install dependencies
bun install

# Setup database
bun run db:push

# Seed database (optional - untuk sample data)
bun run db:seed

# Start development server
bun run dev
```

### Environment Variables

```env
# SQLite Database (local development)
DATABASE_URL="file:../db/puspa.db"
```

> Untuk production dengan Supabase PostgreSQL, tukar ke connection string Supabase.

### Development

```bash
# Run linting
bun run lint

# Generate Prisma client
bun run db:generate

# Push schema changes
bun run db:push

# Reset database (destructive)
bun run db:reset
```

## 🗄️ Database Schema

| Model | Penerangan | Kaitan |
|---|---|---|
| `Member` | Ahli pertubuhan (asnaf, sukarelawan, penderma, staf) | has many Donation, ProgrammeMember, WelfareAssessment, CommunicationLog |
| `Programme` | Program kebajikan | has many Donation, ProgrammeMember, Activity |
| `Donation` | Rekod sumbangan | belongs to Programme?, Member? |
| `Activity` | Aktiviti & log | belongs to Programme? |
| `ProgrammeMember` | Keahlian program | belongs to Programme, Member |
| `WelfareAssessment` | Penilaian kebajikan ahli | belongs to Member |
| `CommunicationLog` | Log komunikasi | belongs to Member |

## 🎨 Design System

- **Tema Utama**: Ungu PUSPA (`oklch(0.55 0.24 300)`)
- **Tema OpenClaw**: Merah-Coklat (`oklch(0.55 0.22 25)`)
- **Fonts**: Poppins (headings), Inter (body), JetBrains Mono (code/terminal)
- **Dark Mode**: Disokong sepenuhnya
- **Component Library**: shadcn/ui (New York style)
- **Icons**: Lucide React

## 🌐 Deployment

| Platform | URL |
|---|---|
| **Production (Vercel)** | https://puspa-chi.vercel.app |
| **GitHub** | https://github.com/thisisniagahub/puspa |

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan deployment lengkap.

## 📜 Dokumentasi

| Dokumen | Penerangan |
|---|---|
| [README.md](./README.md) | Overview projek & quick start |
| [PRD.md](./PRD.md) | Product Requirements Document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Senibina sistem & keputusan teknikal |
| [DESIGN.md](./DESIGN.md) | UI/UX design system & guidelines |
| [API.md](./API.md) | Rujukan API lengkap |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Panduan deployment |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Panduan penyumbang |
| [CHANGELOG.md](./CHANGELOG.md) | Log perubahan |

## 📄 Lesen

Projek ini dibangunkan untuk **Pertubuhan Urus Peduli Asnaf (PUSPA)**. Hak cipta terpelihara.

---

<p align="center">
  <strong>PUSPA</strong> — Mengurus Peduli, Membangun Ummah 🤲
</p>
