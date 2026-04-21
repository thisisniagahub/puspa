# PRD — Product Requirements Document

## PUSPA Product Requirements Document

> **Versi**: 1.1.0
> **Status**: Active Development
> **Pemilik Produk**: Pertubuhan Urus Peduli Asnaf (PUSPA)
>
> **Current direction**:
> - PUSPA fokus pada operasi NGO, case workflow, disbursement control, dan operator intelligence
> - OpenClaw berada di luar app UI utama sebagai automation + messaging layer
> - login experience, case intelligence, dan payout readiness sekarang dianggap sebahagian daripada baseline product, bukan stretch feature

---

## 1. Ringkasan Eksekutif

### 1.1 Latar Belakang

Pertubuhan Urus Peduli Asnaf (PUSPA) ialah sebuah pertubuhan kebajikan Islam yang menguruskan asnaf (penerima zakat/derma), sukarelawan, program kebajikan, dan sumbangan kewangan. Pada masa kini, operasi harian diuruskan secara manual menggunakan spreadsheet dan kertas kerja, yang menyebabkan:

- Kekeliruan data dan kehilangan rekod
- Proses keputusan yang perlahan
- Kurangnya visibiliti ke atas kemajuan program
- Kesukaran dalam menjana laporan untuk penderma dan pihak berkuasa
- Tiada platform terpusat untuk pengurusan

### 1.2 Penyelesaian

Membangunkan **sistem pengurusan NGO berorientasikan operasi** yang menggabungkan:
1. **Case dan disbursement workflow** — dari intake, verification, scoring, approval hingga payout
2. **Keupayaan AI yang menyokong operator** — laporan, chat, welfare/member tools, dan recommendation surfaces
3. **Automation layer melalui OpenClaw** — webhook orchestration, alerts, summaries, dan channel delivery

### 1.3 Matlamat Perniagaan

| Matlamat | Metrik Sasaran | Tempoh |
|---|---|---|
| Mempercepat pengurusan ahli | 50% pengurangan masa proses | 6 bulan |
| Meningkatkan ketepatan data | 95% data tepat dan terkini | 3 bulan |
| Mempercepat penjanaan laporan | Dari 3 hari ke 5 minit | serta-merta |
| Meningkatkan penglibatan sukarelawan | 30% peningkatan penglibatan | 12 bulan |
| Memperkemas pengurusan sumbangan | 100% rekod digital | 3 bulan |

---

## 2. Profil Pengguna

### 2.1 Persona Utama

#### 🧑‍💼 Admin PUSPA (Pengguna Utama)
- **Peranan**: Pentadbir sistem, pengurus organisasi
- **Keperluan**: Dashboard overview, pengurusan ahli/program/sumbangan, laporan, pentadbiran
- **Tahap Teknikal**: Sederhana
- **Kekerapan**: Harian
- **Tab utama**: Dashboard, Ahli, Program, Donasi, Alat AI, Admin

#### 📋 Pegawai Program
- **Peranan**: Pengurus program kebajikan
- **Keperluan**: Pengurusan program, tracking bajet, senarai peserta, aktiviti
- **Tahap Teknikal**: Rendah-Sederhana
- **Kekerapan**: Harian
- **Tab utama**: Program, Aktiviti, Ahli

#### 💰 Pegawai Kewangan
- **Peranan**: Pengurus sumbangan dan kewangan
- **Keperluan**: Rekod sumbangan, laporan kewangan, receipt
- **Tahap Teknikal**: Sederhana
- **Kekerapan**: Harian
- **Tab utama**: Donasi, Alat AI (Laporan)

#### 🤖 Penyelaras AI / Tech Lead
- **Peranan**: Konfigurasi dan penyelenggaraan keupayaan AI
- **Keperluan**: Pengurusan MCP Servers, Plugins, Integrations, Agents, Terminal
- **Tahap Teknikal**: Tinggi
- **Kekerapan**: Mingguan
- **Tab utama**: MCP Servers, Plugins, Integrations, Terminal, Agents, Models, Automation

#### 👥 Ahli Asnaf / Sukarelawan (Masa Hadapan)
- **Peranan**: Pengguna akhir
- **Keperluan**: Portal ahli, semakan bantuan, log aktiviti
- **Tahap Teknikal**: Rendah
- **Status**: Roadmap Phase 3

### 2.2 Aliran Pengguna (User Flows)

```
Admin Login → Dashboard → [Ahli | Program | Donasi | Aktiviti | Alat AI | Admin | OpenClaw]
                                          ↓
                                    Command Palette (Ctrl+K)
                                    → Navigasi pantas ke mana-mana tab
```

---

## 3. Spesifikasi Keperluan Fungsian

### 3.1 Modul 1: Dashboard (`dashboard-tab.tsx`)

**EPIC**: EP-001 — Overview Organisasi
**Priority**: P0 (Critical)
**Status**: ✅ Implemented

#### FR-001.1 — Statistik Utama
- Papar 4 kad statistik: Total Ahli Asnaf, Program Aktif, Total Donasi, Sukarelawan Aktif
- Data dikemaskini secara real-time dari database
- Klik pada kad untuk navigasi ke tab berkaitan

#### FR-001.2 — Carta Sumbangan Bulanan
- Carta bar (Recharts) menunjukkan trend sumbangan 12 bulan terakhir
- Tooltip interaktif menunjukkan jumlah dan bulan
- Warna kart 1-5 menggunakan tema PUSPA

#### FR-001.3 — Pecahan Ahli
- Carta donut/pie menunjukkan pecahan ahli mengikut kategori
- Kategori: asnaf, sukarelawan, penderma, staf
- Legend custom dengan icon

#### FR-001.4 — Aktiviti Terkini
- Senarai 5 aktiviti terkini dengan icon berdasarkan jenis
- Badge berwarna mengikut type (programme/donation/member/general/system)

#### FR-001.5 — Quick Stats
- Papar bilangan keluarga yang disokong, tahun perkhidmatan, program, lokasi

#### FR-001.6 — Loading & Error States
- Skeleton loading semasa fetch data
- Error state dengan butang retry
- Empty state guard

---

### 3.2 Modul 2: Pengurusan Ahli (`members-tab.tsx`)

**EPIC**: EP-002 — Pengurusan Ahli CRUD
**Priority**: P0 (Critical)
**Status**: ✅ Implemented

#### FR-002.1 — Senarai Ahli
- Table view (desktop) dan card view (mobile)
- Pagination dengan 10 item per halaman
- Sort mengikut: tarikh sertai, nama, pendapatan, saiz keluarga, kategori
- Search berdasarkan nama
- Filter mengikut kategori (asnaf/sukarelawan/penderma/staf) dan status (active/inactive/suspended)

#### FR-002.2 — Tambah Ahli
- Form dialog dengan validasi Zod
- Fields: name*, icNumber*, phone*, email, address, category, status, joinDate, familyMembers, monthlyIncome, notes, avatar
- Auto-generate IC uniqueness check (409 jika duplikat)

#### FR-002.3 — Edit Ahli
- Pre-populate form dengan data sedia ada
- Validasi IC uniqueness jika berubah

#### FR-002.4 — Lihat Profil Ahli
- Dialog detail dengan maklumat lengkap
- Papar related donations dan programme memberships
- Key-based remounting untuk refresh data

#### FR-002.5 — Padam Ahli
- AlertDialog confirmation
- Cascade delete pada related records (donations, programmeMembers, welfareAssessments, communicationLogs)

#### FR-002.6 — Badge System
- Category badge: asnaf (purple), volunteer (green), donor (blue), staff (amber)
- Status badge: active (green), inactive (gray), suspended (red)

---

### 3.3 Modul 3: Pengurusan Program (`programmes-tab.tsx`)

**EPIC**: EP-003 — Pengurusan Program Kebajikan
**Priority**: P0 (Critical)
**Status**: ✅ Implemented

#### FR-003.1 — Kad Grid Layout
- Responsive grid (1/2/3 columns)
- Category badge + status badge
- Budget progress bar (merah jika melebihi bajet)

#### FR-003.2 — CRUD Program
- Tambah/Edit via Dialog dengan ScrollArea
- Fields: name*, description, category, status, startDate, endDate, location, beneficiaryCount, volunteerCount, budget, actualCost, partners, notes
- 6 kategori: food-aid, education, skills, healthcare, financial, community
- 4 status: active, completed, upcoming, cancelled

#### FR-003.3 — Lihat Detail Program
- Related donations table
- Member list (beneficiary/volunteer/organizer)
- Partner tags (parsed dari JSON atau comma-separated)

#### FR-003.4 — Search & Filter
- Search by name
- Filter by category dan status

---

### 3.4 Modul 4: Pengurusan Donasi (`donations-tab.tsx`)

**EPIC**: EP-004 — Pengurusan Sumbangan
**Priority**: P0 (Critical)
**Status**: ✅ Implemented

#### FR-004.1 — Summary Cards
- Total Donations, This Month Donations, Total Donors

#### FR-004.2 — Table dengan Filter
- Filter: status (confirmed/pending/rejected), method (bank-transfer/cash/online/cheque)
- Search by donor name
- Dropdown menu per row (view/edit/delete)
- Pagination dengan format "X–Y daripada Z"

#### FR-004.3 — CRUD Donasi
- Programme selector dropdown
- Amount validation (> 0)
- Receipt number tracking

#### FR-004.4 — View Detail
- Structured layout: icon + label + value
- Show linked programme dan member

---

### 3.5 Modul 5: Aktiviti Kanban (`activities-kanban.tsx`)

**EPIC**: EP-005 — Board Pengurusan Aktiviti
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-005.1 — Kanban Board
- 4 lajur: Dirancang, Dalam Proses, Selesai, Dibatalkan
- Drag-and-drop antara lajur via @dnd-kit
- Activity card dengan type badge, date, programme name

#### FR-005.2 — Visual Coding
- Left border color mengikut activity type
- Type badges dengan icon

#### FR-005.3 — Round-Robin Assignment
- Aktiviti baru dibahagi secara seimbang ke 4 lajur
- closestCorners collision detection

#### FR-005.4 — Refresh & Counts
- Manual refresh button
- Activity count per column

---

### 3.6 Modul 6: Alat AI (`ai-report-tab.tsx`)

**EPIC**: EP-006 — Keupayaan AI untuk NGO
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-006.1 — Penjanaan Laporan AI
- 4 jenis laporan: Ringkasan, Kewangan, Program, Demografi Ahli
- Custom prompt untuk ad-hoc queries
- AI powered by z-ai-web-dev-sdk (DeepSeek Chat)
- Output dalam format Markdown, Bahasa Melayu

#### FR-006.2 — Sejarah Laporan
- Simpan sehingga 5 laporan terakhir di localStorage
- Load dan padam dari sejarah

#### FR-006.3 — Eksport
- Copy to clipboard
- Print (window.print)
- Download as .txt file

#### FR-006.4 — UI/UX
- State machine: selection → confirm → loading → display
- Loading skeleton dengan Sparkles icon animasi
- AnimatePresence untuk transisi

---

### 3.7 Modul 7: Chat AI (`chat-tab.tsx`)

**EPIC**: EP-007 — Pembantu Maya PUSPA
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-007.1 — Chat Interface
- Message bubbles: user (purple, right), AI (gray, left)
- AI responses rendered as Markdown
- Typing indicator dengan bouncing dots

#### FR-007.2 — Sokongan Suara
- Speech-to-Text input (ms-MY language)
- Text-to-Speech output (Malay voice preference)
- Markdown stripping untuk clean TTS text

#### FR-007.3 — Quick Questions
- Kategori: About PUSPA, For Members, Donations
- Pre-defined soalan untuk kemudahan

#### FR-007.4 — History
- Persist sehingga 50 mesej di localStorage
- Clear history dengan confirmation popover
- Auto-scroll to bottom

---

### 3.8 Modul 8: Alat Ahli (`member-tools-tab.tsx`)

**EPIC**: EP-008 — Analitik Penilaian Ahli
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-008.1 — AI Programme Eligibility
- Semak kelayakan ahli untuk program aktif
- Match score (%) dengan animated bar
- AI-powered via z-ai-web-dev-sdk

#### FR-008.2 — Kalkulator Bantuan Kewangan
- Formula BMT (Bantuan Mengikut Tahap)
- Inputs: income, family size, category, special needs
- Breakdown: garis kemiskinan, jurang pendapatan, pendaraban keluarga, pelarasan kategori, keperluan khas
- Categories: OKU (+500), warga emas (+300), ibu tunggal (+400), pelajar (+200)

#### FR-008.3 — Penilaian Kebajikan
- 5 dimensi slider: food security, education, healthcare, financial, housing
- Scale 1-5 per dimensi
- Overall score (average)
- History tracking (last 10 assessments)

#### FR-008.4 — Log Komunikasi
- Create contact records: phone, visit, meeting, email, aid-distribution
- Priority levels: low, normal, high, urgent
- Follow-up tracking dengan date

---

### 3.9 Modul 9: Admin (`admin-tab.tsx`)

**EPIC**: EP-009 — Maklumat Pentadbiran
**Priority**: P2 (Medium)
**Status**: ✅ Implemented

#### FR-009.1 — Organisasi Info
- Full name, address, email, phone, website, years of service

#### FR-009.2 — Ahli Lembaga
- Top 2 (Penasihat, Pengerusi) dalam kad besar
- Remaining 4 dalam grid kecil

#### FR-009.3 — Programme Portfolio
- 4 kategori program dengan statistik

#### FR-009.4 — Rakan Strategik
- Grid 6 partner dengan icon

#### FR-009.5 — Maklumat Bank
- Maybank account number
- Copy-to-clipboard functionality

---

### 3.10 Modul 10: MCP Servers (`mcp-servers-content.tsx`)

**EPIC**: EP-010 — OpenClaw MCP Server Management
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-010.1 — CRUD MCP Server
- Add/Edit/Delete via dialog forms
- 3 transport types: STDIO, SSE, Streamable HTTP
- STDIO: command + args
- HTTP: URL + dynamic headers
- Environment variables editor (key-value pairs)

#### FR-010.2 — Test Connection
- Simulated latency test
- Status-based feedback (toast notification)

#### FR-010.3 — Enable/Disable Toggle
- Per-server toggle dengan visual opacity dimming
- Status dot dengan pulse animation

---

### 3.11 Modul 11: Plugins (`plugins-content.tsx`)

**EPIC**: EP-011 — OpenClaw Plugin Marketplace
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-011.1 — Plugin Management
- Card grid layout (1/2/3 columns responsive)
- Filter by source: All, Native, Codex, Claude, Cursor, Bundles
- Status dots, version badges, source color-coded badges

#### FR-011.2 — Install Plugin
- 3 methods: Local Directory, Archive URL, Marketplace
- 6 marketplace plugins available

#### FR-011.3 — Configure Plugin
- Custom slide-over panel
- Name, log level, max memory, auto-start toggle

#### FR-011.4 — Stats Bar
- Total plugins, running count, bundle count

---

### 3.12 Modul 12: Integrations (`integrations-content.tsx`)

**EPIC**: EP-012 — OpenClaw Service Integrations
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-012.1 — Integration Templates
- 17 templates across 4 categories
- Channels: Discord, Telegram, WhatsApp, Slack, Teams, LINE, Signal, IRC
- Models: Claude, GPT-4, Gemini, Groq, OpenRouter
- Webhooks: Relay, Custom
- Storage: AWS S3, Memory Wiki, File Storage

#### FR-012.2 — Category Tabs
- Tabs navigation dengan badge counters per category

#### FR-012.3 — Configure Integration
- Sheet panel per integration
- Typed config fields (text/password/url)
- Test Connection (simulated)
- Save/Cancel/Disconnect actions

---

### 3.13 Modul 13: Terminal (`terminal-content.tsx`)

**EPIC**: EP-013 — OpenClaw Gateway Terminal
**Priority**: P2 (Medium)
**Status**: ✅ Implemented

#### FR-013.1 — Terminal Emulator
- macOS-style traffic light dots, title bar
- Monospace font (JetBrains Mono)
- Color-coded lines: green (output), red (error), gray (system), white (input)

#### FR-013.2 — Command Processing
- 9 commands: help, status, version, mcp list, mcp serve, plugins list, agents list, models list, clear
- Live data from Zustand store
- Simulated response delay (80-300ms)

#### FR-013.3 — History Navigation
- Arrow Up/Down keys
- Dedicated chevron buttons

#### FR-013.4 — Side Panel
- Connection status, session info
- Quick command buttons
- Color legend

---

### 3.14 Modul 14: Agents (`agents-content.tsx`)

**EPIC**: EP-014 — OpenClaw AI Agent Management
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-014.1 — Agent Cards
- Status-colored avatar, model name, personality preview
- Session count, workspace path
- Actions: Configure, Edit, Sessions, Play/Pause

#### FR-014.2 — Create & Configure Agent
- Name, Model selection (6 models)
- Personality/SOUL.md, System Prompt Template
- Skill Allowlist (10 skills)
- Channel Bindings (6 channels)
- Tools Configuration (6 tools)
- Per-Agent MCP Servers (4 servers)

#### FR-014.3 — Routing Diagram
- Visual flow: Incoming Message → Router → Agent
- Two scenarios: One Number Multiple People, Same Channel Different Agents

---

### 3.15 Modul 15: Models (`models-content.tsx`)

**EPIC**: EP-015 — OpenClaw Model Configuration
**Priority**: P1 (High)
**Status**: ✅ Implemented

#### FR-015.1 — Provider Management
- Provider cards dengan status, latency, cost-per-token
- Set as Primary, Test, Remove actions
- Crown badge untuk primary model

#### FR-015.2 — Failover Chain
- Visual node chain: Primary → Fallback 1 → Fallback 2...
- Add/remove fallbacks

#### FR-015.3 — Specialized Models
- Image Model (vision/OCR)
- PDF Model (document extraction)
- Image Generation (DALL-E 3, SDXL, Midjourney, FLUX, Imagen)
- Video Generation (Runway, Pika, Luma, Kling)
- Music Generation (Suno, Udio, MusicGen)

#### FR-015.4 — Provider Directory
- 24 providers dengan search
- Connect/Configure buttons

---

### 3.16 Modul 16: Automation (`automation-content.tsx`)

**EPIC**: EP-016 — OpenClaw Task Automation
**Priority**: P2 (Medium)
**Status**: ✅ Implemented

#### FR-016.1 — Scheduled Tasks
- Create dengan name, agent, schedule type, cron expression
- Enable/disable toggle
- Next run countdown, last run status

#### FR-016.2 — Background Tasks
- Read-only progress view
- Progress bar, cancel button
- Result summary display

#### FR-016.3 — Standing Orders
- Trigger → action rules
- Agent assignment
- Trigger count display

#### FR-016.4 — Webhooks
- Endpoint URL + signing secret
- 8 event types via checkboxes
- Active/inactive toggle

---

## 4. Keperluan Bukan Fungsian

### 4.1 Prestasi

| Keperluan | Sasaran |
|---|---|
| First Contentful Paint (FCP) | < 2 saat |
| Time to Interactive (TTI) | < 4 saat |
| API response time | < 500ms (95th percentile) |
| Lighthouse score | > 90 |

### 4.2 Keselamatan

| Keperluan | Status | Catatan |
|---|---|---|
| Authentication | 🔲 Roadmap | NextAuth.js v4 sedia ada |
| Role-based Access Control | 🔲 Roadmap | Admin, Officer, Viewer |
| Input validation | ✅ Implemented | Zod schemas |
| API rate limiting | 🔲 Roadmap | AI routes terutamanya |
| XSS prevention | ✅ Partial | React auto-escape |
| CSRF protection | ✅ Partial | SameSite cookies |

### 4.3 Kebolehcapaian (Accessibility)

| Keperluan | Status |
|---|---|
| Semantic HTML (main, header, nav) | ✅ |
| ARIA labels & roles | ✅ Partial |
| Keyboard navigation | ✅ |
| Screen reader support | ✅ Partial (sr-only classes) |
| Focus management | ✅ |
| Color contrast ratio | ✅ (WCAG AA) |

### 4.4 Responsif

| Breakpoint | Layout |
|---|---|
| Mobile (<640px) | Card view, single column, stacked tabs |
| Tablet (640-1024px) | 2-column grid, tab labels visible |
| Desktop (>1024px) | Full table view, multi-column grids |

### 4.5 Antarabangsa (i18n)

| Keperluan | Status |
|---|---|
| Primary language | ✅ Bahasa Melayu |
| Secondary language | 🔲 Roadmap (English) |
| RTL support | 🔲 Roadmap (Arabic/Jawi) |

---

## 5. Skala Prioriti & Roadmap

### Phase 1 — Foundation ✅ (Completed)

- [x] Dashboard dengan statistik
- [x] Pengurusan Ahli CRUD
- [x] Pengurusan Program CRUD
- [x] Pengurusan Donasi CRUD
- [x] Aktiviti Kanban
- [x] Alat AI (Laporan)
- [x] Chat AI dengan suara
- [x] Alat Ahli (4 tools)
- [x] Admin page
- [x] Tema ungu PUSPA + Dark Mode
- [x] Responsive design
- [x] Command Palette

### Phase 2 — OpenClaw Integration ✅ (Completed)

- [x] MCP Servers management
- [x] Plugins marketplace
- [x] Integrations hub (17 templates)
- [x] Terminal emulator
- [x] AI Agents management
- [x] Model providers (24 providers)
- [x] Automation suite
- [x] Gateway status monitoring

### Phase 3 — Production Hardening 🔲 (Roadmap)

- [ ] Authentication & Authorization (NextAuth.js)
- [ ] Role-based access control
- [ ] Audit logging
- [ ] API rate limiting
- [ ] Email notifications
- [ ] Recurring donation setup
- [ ] Member self-service portal
- [ ] Advanced reporting with charts download

### Phase 4 — Advanced AI 🔲 (Roadmap)

- [ ] Real MCP Server connections (bukan mock)
- [ ] Real Plugin execution engine
- [ ] Real Agent orchestration
- [ ] Real Webhook endpoints
- [ ] Multi-language support (EN, AR)
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)
- [ ] Integration dengan JAKIM e-Zakat
- [ ] Integration dengan SSDM (Sistem Semakan Daerah)

### Phase 5 — Scale 🔲 (Roadmap)

- [ ] Multi-branch/organization support
- [ ] Advanced analytics dashboard
- [ ] ML-based fraud detection for donations
- [ ] Automated welfare assessment scoring
- [ ] Integration dengan government databases
- [ ] Blockchain donation tracking

---

## 6. Metrik Kejayaan

| KPI | Kaedah Pengukuran | Sasaran |
|---|---|---|
| Adoption rate | Bilangan active users / total registered | > 80% |
| Data accuracy | % records tanpa error | > 95% |
| Report generation time | Masa dari request ke output | < 30 saat |
| User satisfaction | Survey NPS | > 8/10 |
| System uptime | % masa system online | > 99.5% |
| API response time | P95 response latency | < 500ms |
| Bug resolution time | Masa dari report ke fix | < 48 jam |

---

## 7. Risiko & Mitigasi

| Risiko | Kesan | Kebarangkalian | Mitigasi |
|---|---|---|---|
| Data loss | Tinggi | Rendah | Automated backups, Prisma migrations |
| Security breach | Tinggi | Sederhana | Authentication, RBAC, input validation |
| AI hallucination | Sederhana | Tinggi | Human review workflow, disclaimer |
| Vendor lock-in (AI) | Sederhana | Sederhana | Multi-provider support (6+ providers) |
| Performance degradation | Sederhana | Rendah | Caching, pagination, lazy loading |
| Low adoption | Tinggi | Sederhana | UX research, training, documentation |

---

## 8. Kelulusan & Sign-off

| Peranan | Nama | Tarikh | Status |
|---|---|---|---|
| Product Owner | PUSPA Board | — | ⏳ Pending |
| Tech Lead | thisisniagahub | — | ✅ Approved |
| QA Lead | — | — | ⏳ Pending |

---

* Dokumen ini dikemaskini secara berkala. Sila rujuk CHANGELOG.md untuk sejarah perubahan.
