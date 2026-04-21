# DESIGN — Design System & UI/UX Guidelines

## PUSPA Design System & UI/UX Guidelines

> **Versi**: 1.1.0
> **Status**: Active
>
> **Current emphasis**:
> - skrin login perlu terasa premium dan meyakinkan
> - UI operator perlu mengutamakan tindakan seterusnya, signal risiko, dan readiness state
> - OpenClaw accent kekal sekunder, bukan tema dominan produk

---

## 1. Design Philosophy

### 1.1 Prinsip Reka Bentuk

| Prinsip | Penerangan |
|---|---|
| **Profesional & Dipercayai** | Reka bentuk yang menginspirasikan keyakinan untuk NGO kebajikan Islam |
| **Mudah Digunakan** | Interface intuitif yang boleh digunakan oleh semua peringkat teknikal |
| **Inklusif** | Aksesibel untuk semua pengguna termasuk warga emas dan orang kurang upaya |
| **Konsisten** | Sistem design yang seragam merentasi semua modul |
| **Responsif** | Berfungsi dengan baik di semua saiz skrin |
| **Berprestasi** | Smooth animations tanpa mengorbankan kelajuan |

### 1.2 Brand Identity

| Elemen | Nilai |
|---|---|
| **Nama Produk** | PUSPA (Pertubuhan Urus Peduli Asnaf) |
| **Tagline** | Mengurus Peduli, Membangun Ummah |
| **Warna Utama** | Ungu (#8B5CF6 / oklch 0.55 0.24 300) |
| **Font Heading** | Poppins (weights 300-800) |
| **Font Body** | Inter (weights 400-600) |
| **Font Mono** | JetBrains Mono (code, terminal) |
| **Logo** | puspa-logo-official.png |
| **Icon Library** | Lucide React |

---

## 2. Color System

### 2.1 Primary Palette — PUSPA Purple

```
┌─────────────────────────────────────────────────────────────┐
│  LIGHT MODE                                                  │
│                                                               │
│  Background:    ████████  oklch(0.985 0.002 300)  #FEFCFE   │
│  Foreground:    ████████  oklch(0.145 0.015 300)  #1A0E23   │
│  Primary:       ████████  oklch(0.55 0.24 300)    #7C3AED   │
│  Primary FG:    ████████  oklch(1 0 0)            #FFFFFF   │
│  Secondary:     ████████  oklch(0.95 0.02 300)    #F3E8FF   │
│  Accent:        ████████  oklch(0.94 0.03 300)    #EDD5FF   │
│  Muted:         ████████  oklch(0.96 0.008 300)   #F5F3FA   │
│  Muted FG:      ████████  oklch(0.5 0.01 300)     #7C748A   │
│  Border:        ████████  oklch(0.9 0.012 300)     #E9E5F0   │
│  Card:          ████████  oklch(1 0 0)            #FFFFFF   │
│  Destructive:   ████████  oklch(0.577 0.245 27)   #DC2626   │
│                                                               │
│  DARK MODE                                                   │
│                                                               │
│  Background:    ████████  oklch(0.13 0.015 300)   #0D0A14   │
│  Foreground:    ████████  oklch(0.96 0.008 300)   #F5F3FA   │
│  Primary:       ████████  oklch(0.65 0.25 300)    #A78BFA   │
│  Ring:          ████████  oklch(0.65 0.25 300)    #A78BFA   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Secondary Palette — OpenClaw Accent

Digunakan secara inline (bukan CSS variable) untuk membezakan modul OpenClaw:

```
Light: oklch(0.55 0.22 25)    — Merah-Coklat gelap
Dark:  oklch(0.7 0.18 25)     — Merah-Coklat terang

Penggunaan:
- Tab aktif OpenClaw: bg-[oklch(0.55_0.22_25/0.1)]
- Text OpenClaw:       text-[oklch(0.55_0.22_25)]
- Separator emoji:     🦞
```

### 2.3 Semantic Colors

| Warna | Kegunaan | Tailwind Class |
|---|---|---|
| **Hijau** | Success, active, connected | `bg-green-500`, `text-green-600` |
| **Kuning/Amber** | Warning, degraded, starting | `bg-yellow-500`, `text-amber-600` |
| **Merah/Rose** | Error, destructive, offline | `bg-red-500`, `text-rose-600`, `bg-destructive` |
| **Biru** | Info, donor category | `bg-blue-500`, `text-blue-600` |
| **Ungu** | Primary, asnaf, PUSPA identity | `bg-purple-500`, `text-primary` |
| **Abu-abu** | Neutral, inactive, system | `bg-gray-500`, `text-muted-foreground` |

### 2.4 Chart Colors

```css
--chart-1: oklch(0.55 0.24 300);  /* Ungu (Primary) */
--chart-2: oklch(0.6 0.15 200);   /* Biru */
--chart-3: oklch(0.7 0.18 60);    /* Kuning/Emas */
--chart-4: oklch(0.65 0.2 330);   /* Merah Jambu */
--chart-5: oklch(0.5 0.2 250);    /* Biru Tua */
```

---

## 3. Typography

### 3.1 Font Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  H1 — Page Title                                    │
│  Font: Poppins | Weight: 700 | Size: 24px (1.5rem)  │
│  Line Height: 1.2 | Color: foreground               │
│  Usage: Dashboard, page headers                      │
├─────────────────────────────────────────────────────┤
│  H2 — Section Title                                  │
│  Font: Poppins | Weight: 600 | Size: 20px (1.25rem) │
│  Line Height: 1.3 | Color: foreground               │
│  Usage: Section headers, dialog titles               │
├─────────────────────────────────────────────────────┤
│  H3 — Subsection Title                               │
│  Font: Poppins | Weight: 600 | Size: 16px (1rem)    │
│  Line Height: 1.4 | Color: foreground               │
│  Usage: Card titles, subsection headers              │
├─────────────────────────────────────────────────────┤
│  Body — Main Text                                    │
│  Font: Inter | Weight: 400 | Size: 14px (0.875rem)  │
│  Line Height: 1.6 | Color: foreground               │
│  Usage: Paragraphs, descriptions, content            │
├─────────────────────────────────────────────────────┤
│  Caption — Small Text                                │
│  Font: Inter | Weight: 400 | Size: 12px (0.75rem)  │
│  Line Height: 1.5 | Color: muted-foreground        │
│  Usage: Labels, timestamps, metadata                 │
├─────────────────────────────────────────────────────┤
│  Mono — Code/Terminal                                │
│  Font: JetBrains Mono | Weight: 400 | Size: 13px    │
│  Line Height: 1.6 | Color: foreground               │
│  Usage: Terminal, code blocks, command palette       │
└─────────────────────────────────────────────────────┘
```

### 3.2 CSS Variable Mapping

```css
--font-sans: var(--font-inter);        /* Body */
--font-heading: var(--font-poppins);   /* Headings */
--font-mono: var(--font-geist-mono);   /* Code */
```

---

## 4. Layout System

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header (sticky, h-16, z-30)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Logo] PUSPA    [🔍 Cari… ⌘K]    [🟢 Gateway] [🔔] [🌙] │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Tabs Bar (sticky, z-20, below header)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Dashboard] [Ahli] [Program] ... │ 🦞 [MCP] [Plugins]│  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Main Content (flex-1, p-4 md:p-6)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  Tab Content with AnimatePresence                    │  │
│  │  (fade + slide transition, 180ms ease-in-out)        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Command Palette (overlay, z-50)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ctrl+K → Search tabs, items, actions                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Grid System

```css
/* Breakpoints */
Mobile:       < 640px   (default)
Tablet:       640px+    (sm:)
Desktop:      768px+    (md:)
Large:        1024px+   (lg:)
Extra Large:  1280px+   (xl:)

/* Common Grid Patterns */
Stats Cards:        grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
Programme Cards:   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
Member Tools:      grid grid-cols-1 lg:grid-cols-2 gap-6
Integration Grid:  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

### 4.3 Spacing Scale

```
p-1  = 4px    p-2  = 8px    p-3  = 12px
p-4  = 16px   p-5  = 20px   p-6  = 24px
p-8  = 32px   p-10 = 40px   p-12 = 48px

gap-1 = 4px    gap-2 = 8px    gap-3 = 12px
gap-4 = 16px   gap-5 = 20px   gap-6 = 24px
gap-8 = 32px
```

### 4.4 Border Radius

```css
--radius: 0.625rem (10px)

--radius-sm: calc(var(--radius) - 4px)  = 6px
--radius-md: calc(var(--radius) - 2px)  = 8px
--radius-lg: var(--radius)               = 10px
--radius-xl: calc(var(--radius) + 4px)   = 14px
```

---

## 5. Component Design Patterns

### 5.1 Tab Button

```
┌──────────────────────────────────────┐
│  Active (PUSPA):                      │
│  bg-primary/10 text-primary           │
│  Icon + Label (hidden on mobile icon only)
│                                       │
│  Active (OpenClaw):                   │
│  bg-[oklch(0.55_0.22_25/0.1)]        │
│  text-[oklch(0.55_0.22_25)]          │
│                                       │
│  Inactive:                            │
│  text-muted-foreground                │
│  hover:text-foreground hover:bg-accent/50
│                                       │
│  Structure:                           │
│  <button className="inline-flex items-center gap-1.5
│    px-3 py-1.5 rounded-md text-sm font-medium
│    whitespace-nowrap transition-all"> │
│    <Icon className="w-4 h-4" />      │
│    <span className="hidden sm:inline">│
│  </button>                            │
└──────────────────────────────────────┘
```

### 5.2 Stat Card

```
┌──────────────────────────────────┐
│  ┌──────┐  Total Ahli Asnaf     │
│  │ Icon │  128 orang            │
│  │(w-8) │  ↑ 12% dari bulan lalu│
│  └──────┘                        │
│  bg-card border rounded-xl p-4   │
│  grid grid-cols-[auto_1fr] gap-3│
└──────────────────────────────────┘

Variants:
- Default: bg-card border
- Highlight: bg-gradient-to-r from-primary/10 to-primary/5
- Beneficiary: gradient background purple
```

### 5.3 Data Table (Members)

```
┌──────────────────────────────────────────────────────┐
│  Filter Bar                                           │
│  [🔍 Search...] [Category ▼] [Status ▼] [+ Tambah]   │
├──────────────────────────────────────────────────────┤
│  Table Header                                         │
│  Name | IC | Phone | Category | Status | Actions     │
├──────────────────────────────────────────────────────┤
│  Row 1     |...|.....| Badge    | Badge   | [⋮ Menu] │
│  Row 2     |...|.....| Badge    | Badge   | [⋮ Menu] │
│  ...                                                  │
├──────────────────────────────────────────────────────┤
│  Pagination                                           │
│  Showing 1-10 of 45    [< ] [1] [2] [3] [ >]        │
└──────────────────────────────────────────────────────┘
```

### 5.4 Card Grid (Programmes)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Category Badge   │  │ Category Badge   │  │ Category Badge   │
│                  │  │                  │  │                  │
│ Programme Name   │  │ Programme Name   │  │ Programme Name   │
│ Description...   │  │ Description...   │  │ Description...   │
│                  │  │                  │  │                  │
│ Budget Progress  │  │ Budget Progress  │  │ Budget Progress  │
│ ████░░░░ RM5,000 │  │ ██████░░ RM8,000 │  │ ██░░░░░░ RM2,000 │
│                  │  │                  │  │                  │
│ [Batal] [Aktif]  │  │ [Selesai]       │  │ [Akan Datang]    │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Structure:
<Card className="overflow-hidden">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-2">
      <Badge>{category}</Badge>
      <Badge variant="outline">{status}</Badge>
    </div>
    <CardTitle>{name}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={percentage} />
  </CardContent>
</Card>
```

### 5.5 Kanban Board (Activities)

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  DIRANCANG (3)  │  │ DALAM PROSES(2)│  │  SELESAI (5)   │  │ DIBATALKAN (1) │
├────────────────┤  ├────────────────┤  ├────────────────┤  ├────────────────┤
│ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │  │ ┌────────────┐ │
│ ││Programme  │ │  │ ││Donation   │ │  │ ││General    │ │  │ ││Programme  │ │
│ ││Card       │ │  │ ││Card       │ │  │ ││Card       │ │  │ ││Card       │ │
│ ││with type  │ │  │ ││with type  │ │  │ ││with type  │ │  │ ││with type  │ │
│ ││badge      │ │  │ ││badge      │ │  │ ││badge      │ │  │ ││badge      │ │
│ ││and date   │ │  │ ││and date   │ │  │ ││and date   │ │  │ ││and date   │ │
│ │└────────────┘ │  │ └────────────┘ │  │ └────────────┘ │  │ └────────────┘ │
│ ┌────────────┐ │  │ ┌────────────┐ │  │                │  │                │
│ ││Activity   │ │  │ ││Activity   │ │  │                │  │                │
│ ││Card       │ │  │ ││Card       │ │  │                │  │                │
│ │└────────────┘ │  │ └────────────┘ │  │                │  │                │
└────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘

Drag handle: cursor-grab active:cursor-grabbing
Drop zones: useDroppable with closestCorners collision
Activity type left border colors:
  programme: purple | donation: green | member: blue | general: gray | system: amber
```

### 5.6 Dialog Form (Add/Edit)

```
┌──────────────────────────────────────────┐
│  Tambah Ahli                        [✕]  │
├──────────────────────────────────────────┤
│                                          │
│  Maklumat Peribadi                        │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ Nama Penuh *   │ │ No. IC *       │  │
│  └────────────────┘ └────────────────┘  │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ Telefon *      │ │ Emel           │  │
│  └────────────────┘ └────────────────┘  │
│  ┌────────────────────────────────────┐ │
│  │ Alamat                             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Kategori & Status                       │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ Kategori [▼]   │ │ Status [▼]     │  │
│  └────────────────┘ └────────────────┘  │
│                                          │
│  Maklumat Kewangan                       │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ Pendapatan     │ │ Bil. Keluarga  │  │
│  └────────────────┘ └────────────────┘  │
│  ┌────────────────────────────────────┐ │
│  │ Catatan                            │ │
│  └────────────────────────────────────┘ │
│                                          │
│              [Batal]  [Simpan]           │
└──────────────────────────────────────────┘

Pattern: Zod schema → react-hook-form → Form validation → API call
```

### 5.7 Chat Interface

```
┌──────────────────────────────────────────┐
│  Chat AI PUSPA                       [🗑️]│
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 👋 Assalamualaikum! Saya         │    │
│  │ pembantu maya PUSPA. Ada apa    │    │
│  │ yang boleh saya bantu?          │    │
│  │                    [📋] [🔊]     │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │              Berapa jumlah ahli  │    │
│  │ asnaf yang aktif?         [🎤]   │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ 👋 Berdasarkan data terkini,    │    │
│  │ PUSPA mempunyai 128 ahli asnaf  │    │
│  │ yang aktif...                   │    │
│  │                    [📋] [🔊]     │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ● ● ●  (typing indicator)              │
│                                          │
├──────────────────────────────────────────┤
│  Quick Questions:                         │
│  [About PUSPA] [Members] [Donations]     │
├──────────────────────────────────────────┤
│  ┌──────────────────────────────────┐[🎤]│
│  │ Taip mesej anda...              │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

### 5.8 Terminal Emulator

```
┌──────────────────────────────────────────────────┐
│ ● ● ●  OpenClaw Terminal v1.0.0          [⛶] [✕]│
├──────────────────────────────────────────────────┤
│ OpenClaw Terminal v1.0.0                          │
│ Initializing runtime environment...               │
│   ✓ Gateway connected (wss://gateway.openclaw.dev)│
│   ✓ 4 MCP servers loaded                          │
│   ✓ 8 plugins initialized                         │
│                                                   │
│ Welcome to OpenClaw. Type "help" for commands.    │
│                                                   │
│ > help                                            │
│ Available commands:                               │
│   help          Show this help message            │
│   status        System status overview            │
│   mcp list      List MCP servers                  │
│   agents list   List active agents                │
│   clear         Clear terminal                    │
│                                                   │
│ > █                                              │
├──────────────────────────────────────────────────┤
│  🟢 Connected  │  uptime: 24h  │  dir: /home/z   │
└──────────────────────────────────────────────────┘

Font: JetBrains Mono
Line colors: green=output, red=error, gray=system, white=input
```

---

## 6. Badge & Status Design

### 6.1 Category Badges (PUSPA)

| Kategori | Background | Text | Tailwind |
|---|---|---|---|
| **asnaf** | bg-purple-100 dark:bg-purple-900/30 | text-purple-700 dark:text-purple-300 | Primary purple |
| **sukarelawan** | bg-green-100 dark:bg-green-900/30 | text-green-700 dark:text-green-300 | Green |
| **penderma** | bg-blue-100 dark:bg-blue-900/30 | text-blue-700 dark:text-blue-300 | Blue |
| **staf** | bg-amber-100 dark:bg-amber-900/30 | text-amber-700 dark:text-amber-300 | Amber |

### 6.2 Status Badges

| Status | Variant | Icon |
|---|---|---|
| **active** | default (green) | Circle dot |
| **completed** | secondary (gray) | Check circle |
| **upcoming** | outline (blue) | Clock |
| **cancelled** | destructive (red) | X circle |
| **pending** | outline (yellow) | Clock |
| **running** | default (green, pulse) | Activity |
| **error** | destructive (red) | Alert circle |
| **connected** | default (green, pulse) | Wifi |
| **disconnected** | destructive (red) | Wifi off |

### 6.3 OpenClaw Plugin Source Badges

| Source | Light BG | Dark BG |
|---|---|---|
| **openclaw** | bg-orange-100 text-orange-700 | dark:bg-orange-900/30 dark:text-orange-300 |
| **codex** | bg-green-100 text-green-700 | dark:bg-green-900/30 dark:text-green-300 |
| **claude** | bg-purple-100 text-purple-700 | dark:bg-purple-900/30 dark:text-purple-300 |
| **cursor** | bg-blue-100 text-blue-700 | dark:bg-blue-900/30 dark:text-blue-300 |

---

## 7. Animation Guidelines

### 7.1 Motion Principles

| Prinsip | Peraturan |
|---|---|
| **Purposeful** | Setiap animasi ada tujuan — memberi feedback, menunjukkan perubahan state |
| **Subtle** | Kecil dan pantas — tidak mengganggu pengguna |
| **Consistent** | Sama timing dan easing merentasi semua modul |
| **Accessible** | Respect `prefers-reduced-motion` |

### 7.2 Animation Tokens

```typescript
// Tab content transition (Framer Motion)
initial:   { opacity: 0, y: 6 }
animate:   { opacity: 1, y: 0 }
exit:      { opacity: 0, y: -6 }
transition: { duration: 0.18, ease: 'easeInOut' }

// Dashboard stagger (Framer Motion)
container: { staggerChildren: 0.08 }
item:      { opacity: 0, y: 18 } → { opacity: 1, y: 0 }
duration:  0.3s

// Loading states
Skeleton:  animate-pulse
Spinner:   animate-spin (duration-700)
Gateway:   animate-pulse (status dot)

// Interactive feedback
Hover:     transition-all duration-150
Focus:     ring-2 ring-ring ring-offset-2
Click:     scale-[0.98] → scale-100 (transition-100)
```

### 7.3 Loading Patterns

```
1. Skeleton Loading (Initial Load)
   ┌──────────────┐
   │ ░░░░░░░░░░░░░│  animate-pulse
   │ ░░░░░░░░░░░░░│
   │ ░░░░░░░░░░░░░│
   └──────────────┘
   Usage: Table rows, card placeholders, stat cards

2. Spinner (Subsequent Loads)
   (  ⏳  )  animate-spin
   Usage: Button loading, dialog submission

3. Typing Indicator (Chat)
   ● ● ●  animate-bounce (staggered)
   Usage: AI response pending

4. Progress Bar (Long Operations)
   ████████░░░░  Progress component
   Usage: AI report generation, background tasks
```

---

## 8. Responsive Design

### 8.1 Breakpoint Behavior

```
┌──────────────────────────────────────────────────────────┐
│  MOBILE (<640px)                                         │
│  ┌────────────────────────┐                               │
│  │ [Logo] PUSPA    [🔍][🔔][🌙]                         │
│  │ [⬅️][Dashboard][Ahli][Pro]...[🦞][MCP]...[➡️]        │
│  │                                                        │
│  │ ┌────────────────────┐                                │
│  │ │ Card View (stack)  │  ← Table becomes card          │
│  │ │ Name               │                                │
│  │ │ IC • Phone         │                                │
│  │ │ [Badge] [Badge]    │                                │
│  │ └────────────────────┘                                │
│  └────────────────────────┘                               │
├──────────────────────────────────────────────────────────┤
│  TABLET (640-1024px)                                     │
│  ┌──────────────────────────────────────────┐            │
│  │ [Logo] PUSPA  [🔍 Cari ⌘K]    [🟢][🔔][🌙]│            │
│  │ [Dashboard][Ahli][Program]...│🦞[MCP]... │            │
│  │                                          │            │
│  │ ┌──────────┐ ┌──────────┐                │            │
│  │ │ Card     │ │ Card     │  2-col grid    │            │
│  │ └──────────┘ └──────────┘                │            │
│  └──────────────────────────────────────────┘            │
├──────────────────────────────────────────────────────────┤
│  DESKTOP (>1024px)                                       │
│  ┌──────────────────────────────────────────────────┐    │
│  │ [Logo] PUSPA  [🔍 Cari ⌘K]  [🟢Gateway] [🔔] [🌙] │    │
│  │ [Dashboard][Ahli][Program][Donasi][Aktiviti]...  │    │
│  │                                                   │    │
│  │ Full table view / 3-4 column grids                │    │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │    │
│  │ │Stat 1│ │Stat 2│ │Stat 3│ │Stat 4│              │    │
│  │ └──────┘ └──────┘ └──────┘ └──────┘              │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 8.2 Touch Targets

| Element | Minimum Size | Spacing |
|---|---|---|
| Buttons | 44x44px | 8px gap |
| Tab buttons | 44x36px | 4px gap |
| Table row actions | 44x44px | — |
| Input fields | 44px height | 12px gap |
| Badge | 24px height | 8px gap |
| Icon buttons | 36x36px | — |

### 8.3 Mobile-Specific Patterns

```tsx
// Dual layout pattern (Members Tab)
const isMobile = useIsMobile();

return isMobile ? (
  <MobileCardView members={members} />
) : (
  <DesktopTableView members={members} />
);

// Tabs scrolling on mobile
<div className="flex items-center gap-1 overflow-x-auto tabs-scrollbar">
  {tabs.map(...)}
</div>

// Full-width forms on mobile
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input ... />  {/* Full width on mobile, 2-col on sm+ */}
  <Input ... />
</div>
```

---

## 9. Iconography

### 9.1 Icon Usage Guidelines

```tsx
// Standard sizes
<w-4 h-4 />  // 16px — Inline, badges, table actions
<w-5 h-5 />  // 20px — Button icons, tab icons
<w-6 h-6 />  // 24px — Stat card icons, section icons
<w-8 h-8 />  // 32px — Large stat icons
<w-10 h-10 /> // 40px — Hero icons, empty states

// Standard color
text-foreground          // Default
text-muted-foreground    // Secondary
text-primary             // Accent/brand
text-destructive         // Error/danger
text-green-500           // Success
```

### 9.2 Key Icon Assignments

| Modul | Icon | Lucide Name |
|---|---|---|
| Dashboard | 📊 | LayoutDashboard |
| Ahli | 👥 | Users |
| Program | 📁 | FolderKanban |
| Donasi | ❤️ | Heart |
| Aktiviti | 📅 | Calendar |
| Alat AI | 🪄 | Wand2 |
| Chat AI | 💬 | MessageCircle |
| Alat Ahli | 🔧 | Wrench |
| Admin | ⚙️ | Settings |
| MCP Servers | 🖥️ | Server |
| Plugins | 🧩 | Puzzle |
| Integrations | 🔗 | Link2 |
| Terminal | ▢ | TerminalSquare |
| Agents | 🤖 | Bot |
| Models | 🧠 | Cpu |
| Automation | ⚡ | Zap |

---

## 10. Empty & Error States

### 10.1 Empty State Pattern

```
┌──────────────────────────────────────────┐
│                                          │
│              📋 (or themed icon)          │
│                                          │
│        Tiada ahli untuk dipaparkan        │
│    Mulakan dengan menambah ahli baharu    │
│                                          │
│            [+ Tambah Ahli]               │
│                                          │
└──────────────────────────────────────────┘

Structure:
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
  <h3 className="text-lg font-semibold">Title</h3>
  <p className="text-sm text-muted-foreground mt-1">Description</p>
  <Button className="mt-4">Action</Button>
</div>
```

### 10.2 Error State Pattern

```
┌──────────────────────────────────────────┐
│                                          │
│              ⚠️ (AlertTriangle)           │
│                                          │
│        Gagal memuatkan data               │
│    Sila cuba lagi atau hubungi admin      │
│                                          │
│              [Cuba Lagi]                 │
│                                          │
└──────────────────────────────────────────┘
```

### 10.3 Loading Skeleton Pattern

```
Before data loads:                    After data loads:
┌──────────────────────────┐          ┌──────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░│          │ Total Ahli Asnaf          │
│ ░░░░░░░░░░░░░░░░░░░░░░░│    →     │ 128 orang                │
│ ░░░░░░░░░░░░░░░░░░░░░░░│          │ ↑ 12% dari bulan lalu    │
└──────────────────────────┘          └──────────────────────────┘

<Skeleton className="h-28 rounded-xl" />
```

---

## 11. Accessibility

### 11.1 ARIA Implementation

```tsx
// Semantic HTML
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<section aria-labelledby="section-title">

// Interactive elements
<button aria-label="Toggle theme" aria-expanded={false}>
<input aria-describedby="help-text" aria-invalid={hasError}>
<div role="status" aria-live="polite">  {/* Toast notifications */}

// Screen reader only
<span className="sr-only">Loading content...</span>
```

### 11.2 Keyboard Navigation

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous element |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close dialog/dropdown |
| `↑` / `↓` | Navigate list items, terminal history |

### 11.3 Focus Management

```tsx
// Visible focus ring
className="ring-2 ring-ring ring-offset-2 ring-offset-background"

// Focus trap in dialogs (shadcn Dialog handles this)
// Focus return on dialog close
```

---

* Dokumen ini dikemaskini secara berkala. Sila rujuk CHANGELOG.md untuk sejarah perubahan.
