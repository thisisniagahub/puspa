# PUSPA - Pertubuhan Urus Peduli Asnaf

> Sistem pengurusan NGO kebajikan Islam dengan case workflow, intelligence panel, payout ops, dan integrasi OpenClaw sebagai automation layer.

<p align="center">
  <img src="/puspa-logo-official.png" alt="PUSPA Logo" width="120" height="120" />
  <br />
  <strong>Pertubuhan Urus Peduli Asnaf</strong>
  <br />
  <em>Platform operasi NGO untuk kes, bantuan, sumbangan, dan tindakan operator</em>
</p>

---

## 📖 Deskripsi

**PUSPA** ialah aplikasi operasi NGO yang memusatkan pengurusan kes bantuan, disbursement, sumbangan, ahli, program, dan tugasan operator dalam satu antaramuka yang lebih moden.

Arah produk semasa:
- **PUSPA** kekal sebagai aplikasi teras untuk rekod, workflow, dan skrin operasi harian
- **OpenClaw** digunakan sebagai lapisan automation, webhook orchestration, dan channel messaging
- integrasi Telegram berjalan melalui route webhook PUSPA dan lane bot khas seperti `PuspaCareBot`

> Untuk arah integrasi yang terkini, rujuk `docs/OPENCLAW-INTEGRATION.md`.

## ✨ Status Produk Semasa

### Shipped sekarang

| Area | Status |
|---|---|
| **Login experience** | UI log masuk premium dengan transition yang lebih advanced, visual trust panel, dan auth flow sedia ada dikekalkan |
| **Dashboard** | Paparan overview operasi selepas login dengan statistik, kes terkini, dan sumbangan terkini |
| **Case Operations** | CRUD kes, notes timeline, status workflow, dan panel intelligence operator |
| **Case Intelligence** | `nextAction`, `beneficiary360`, `riskFlags`, `relatedCases`, `recommendations`, `quickSignals` pada detail kes |
| **Disbursement Ops** | Cipta disbursement dari kes layak, readiness/reconciliation flags, dan progression status payout |
| **Donations / Members / Programmes / Activities** | Modul pengurusan operasi utama sudah tersedia |
| **AI Tools** | Laporan AI, chat AI, dan member tools masih tersedia sebagai lapisan bantuan operasi |
| **OpenClaw Bridge** | Outbound webhook bridge + optional Telegram notification lane untuk event ops PUSPA |

### OpenClaw integration reality

OpenClaw **bukan** UI utama PUSPA. Ia kini diposisikan sebagai:
- webhook/event receiver
- automations dan summaries
- operator alert delivery ke Telegram / channel lain
- agent task orchestration bila diperlukan

## 🔧 Ciri-ciri Teknikal Semasa

- **Hydration-safe rendering** dengan `useSyncExternalStore`
- **Role-based auth + session token** untuk skrin dalaman
- **Advanced motion login UI** dengan `framer-motion`
- **Case workflow + case notes** pada API `v1`
- **Disbursement workflow sync** dengan status kes
- **Responsive dashboard routes** untuk setiap modul utama
- **Optional outbound webhook + direct Telegram alert lane** dari PUSPA

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
│   │   ├── page.tsx            # Login gate + authenticated dashboard entry
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
npm install

# Setup database
npm run db:push

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..." 
TOKEN_SECRET="replace-with-long-random-secret"
SETUP_SECRET="replace-with-long-random-setup-secret"

# Optional OpenClaw / Telegram bridge
PUSPA_OPENCLAW_WEBHOOK_ENABLED=false
PUSPA_OPENCLAW_WEBHOOK_URL=
PUSPA_OPENCLAW_WEBHOOK_SECRET=
PUSPA_TELEGRAM_ENABLED=false
PUSPA_TELEGRAM_BOT_TOKEN=
PUSPA_TELEGRAM_CHAT_ID=
```

> Lihat `.env.example` dan `docs/OPENCLAW-INTEGRATION.md` untuk env contract semasa.

### Development

```bash
# Run linting
npm run lint

# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Reset database (destructive)
npm run db:reset
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
