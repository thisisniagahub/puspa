# CONTRIBUTING — Panduan Penyumbang

## PUSPA + OpenClaw Integrated Platform

> **Versi**: 1.0.0
> **Tarikh**: Julai 2025

---

## 1. Cara Menyumbang

Kami mengalu-alukan sumbangan dari semua pihak! Berikut adalah cara anda boleh menyumbang:

### 1.1 Jenis Sumbangan

| Jenis | Penerangan |
|---|---|
| 🐛 **Bug Report** | Laporkan bug yang anda jumpai |
| ✨ **Feature Request** | Cadangkan ciri baru |
| 📖 **Documentation** | Perbaiki atau tambah dokumentasi |
| 🔧 **Code Contribution** | Submit pull request dengan kod |
| 🎨 **Design** | Cadangkan penambahbaikan UI/UX |
| 🌐 **Translation** | Terjemah ke bahasa lain |

---

## 2. Setup Development

### 2.1 Fork & Clone

```bash
# 1. Fork repository di GitHub
# 2. Clone fork anda
git clone https://github.com/YOUR_USERNAME/puspa.git
cd puspa

# 3. Install dependencies
bun install

# 4. Setup database
bun run db:push
bun run db:seed

# 5. Start development
bun run dev
```

### 2.2 Create Branch

```bash
# Dari main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/nama-ciri-anda
# atau
git checkout -b fix/nama-bug-anda
# atau
git checkout -b docs/nama-dokumen
```

### 2.3 Branch Naming Convention

```
feature/short-description     # Ciri baru
fix/short-description         # Bug fix
docs/short-description        # Dokumentasi
refactor/short-description    # Refaktor kod
style/short-description       # Styling changes
test/short-description        # Tests
chore/short-description       # Maintenance
```

---

## 3. Coding Standards

### 3.1 TypeScript

```typescript
// ✅ DO: Use strict typing
interface Member {
  id: string;
  name: string;
  category: 'asnaf' | 'volunteer' | 'donor' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
}

// ❌ DON'T: Use 'any' unless absolutely necessary
function processData(data: any) { ... }

// ✅ DO: Use explicit return types for API routes
export async function GET(request: Request): Promise<Response> { ... }

// ✅ DO: Use proper null checks
const member = members.find(m => m.id === id);
if (!member) return notFound();

// ✅ DO: Use const untuk variables yang tidak berubah
const MAX_ITEMS = 100;
const ALLOWED_TYPES = ['phone', 'visit', 'meeting'] as const;
```

### 3.2 React/Next.js

```tsx
// ✅ DO: Use 'use client' directive at top of client components
'use client';

// ✅ DO: Use semantic HTML
<header>, <nav>, <main>, <section>, <article>

// ✅ DO: Use shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// ❌ DON'T: Create custom UI components when shadcn/ui exists
// Use existing shadcn/ui components instead

// ✅ DO: Use cn() utility for conditional classes
import { cn } from '@/lib/utils';
className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes'
)}

// ✅ DO: Use Zod for form validation
import { z } from 'zod';
const memberSchema = z.object({
  name: z.string().min(1, 'Nama diperlukan'),
  icNumber: z.string().min(12, 'No. IC tidak sah'),
});

// ✅ DO: Use useCallback for handlers passed as props
const handleClick = useCallback(() => {
  setActiveTab('dashboard');
}, []);
```

### 3.3 API Routes

```typescript
// ✅ DO: Use proper HTTP status codes
return NextResponse.json({ data }, { status: 201 });  // Created
return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ error: 'Bad request' }, { status: 400 });

// ✅ DO: Validate input on server
const body = await request.json();
if (!body.name || !body.icNumber) {
  return NextResponse.json({ error: 'Name and IC required' }, { status: 400 });
}

// ✅ DO: Use Prisma for database operations
import { db } from '@/lib/db';
const member = await db.member.findUnique({ where: { id } });

// ❌ DON'T: Put business logic in client components
// Keep data fetching and mutations in API routes
```

### 3.4 Styling

```tsx
// ✅ DO: Use Tailwind CSS utility classes
<div className="flex items-center gap-4 p-6 rounded-xl border">

// ✅ DO: Follow responsive design
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// ❌ DON'T: Use inline styles unless dynamic
// Use Tailwind classes instead

// ✅ DO: Use existing CSS variables for theming
className="bg-primary text-primary-foreground"

// ❌ DON'T: Use hardcoded colors that don't match the theme
className="bg-[#8B5CF6]"  // Use bg-primary instead
```

### 3.5 Naming Conventions

| Item | Convention | Contoh |
|---|---|---|
| File (component) | kebab-case | `members-tab.tsx`, `mcp-servers-content.tsx` |
| File (API route) | kebab-case | `route.ts` in `/api/members/` |
| Component | PascalCase | `DashboardTab`, `MCPServersContent` |
| Props interface | PascalCase with prefix | `TabDef`, `ServerFormData` |
| Variables | camelCase | `activeTab`, `totalDonations` |
| Constants | UPPER_SNAKE_CASE | `MAX_ITEMS`, `CATEGORY_CONFIG` |
| CSS classes | Tailwind only | `bg-primary`, `text-muted-foreground` |
| Database models | PascalCase | `Member`, `Programme`, `Donation` |
| API routes | kebab-case URL | `/api/members/tools/aid-calculator` |

---

## 4. Commit Messages

### 4.1 Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 4.2 Types

| Type | Penerangan | Contoh |
|---|---|---|
| `feat` | Ciri baru | `feat(members): add bulk delete functionality` |
| `fix` | Bug fix | `fix(donations): correct summary calculation` |
| `docs` | Dokumentasi | `docs(api): update donation endpoint docs` |
| `style` | Styling | `style(dashboard): improve stat card spacing` |
| `refactor` | Refaktor | `refactor(store): simplify MCP server state` |
| `test` | Tests | `test(api): add member creation validation tests` |
| `chore` | Maintenance | `chore(deps): update shadcn/ui components` |
| `perf` | Performance | `perf(stats): optimize dashboard queries` |

### 4.3 Contoh

```
feat(chat): add speech-to-text input support

Implement Web Speech API for voice input in Malay (ms-MY).
Includes toggle button and visual feedback during recording.

Closes #42
```

---

## 5. Pull Request Process

### 5.1 Checklist Sebelum Submit PR

- [ ] Kod berjalan tanpa error (`bun run lint` lulus)
- [ ] Semua komponen baru mengikuti coding standards
- [ ] UI responsive di mobile, tablet, dan desktop
- [ ] Dark mode berfungsi dengan betul
- [ ] Loading states dilaksanakan
- [ ] Error states dilaksanakan
- [ ] ARIA labels ditambah untuk aksesibiliti
- [ ] Tidak ada console.log yang tinggal
- [ ] Commit messages mengikut format

### 5.2 PR Template

```markdown
## Description
[Penerangan perubahan]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
[Cara untuk test perubahan ini]

## Screenshots
[If applicable]

## Related Issues
Closes #[issue number]
```

### 5.3 Review Process

1. Submit PR ke `main` branch
2. Sekurang-kurangnya 1 reviewer approve
3. CI/CD pipeline lulus (lint, build)
4. Merge oleh maintainer

---

## 6. Project Structure Convention

```
src/
├── app/
│   ├── page.tsx              # Single page app entry
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + theme
│   └── api/
│       └── [module]/
│           ├── route.ts      # Collection endpoint
│           └── [id]/
│               └── route.ts  # Single item endpoint
├── components/
│   ├── puspa/                # NGO core modules
│   │   └── [module]-tab.tsx  # Each module as separate file
│   ├── openclaw/             # AI platform modules
│   │   └── [module]-content.tsx
│   ├── ui/                   # shadcn/ui (DO NOT modify manually)
│   └── theme-provider.tsx    # Theme wrapper
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities (db, utils)
└── store/                    # Zustand stores
```

---

## 7. Resources

| Resource | URL |
|---|---|
| Next.js Documentation | https://nextjs.org/docs |
| Tailwind CSS | https://tailwindcss.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Prisma ORM | https://www.prisma.io/docs |
| Zustand | https://zustand.docs.pmnd.rs |
| Framer Motion | https://www.framer.com/motion |
| Lucide Icons | https://lucide.dev |
| Radix UI | https://www.radix-ui.com |

---

## 8. Code of Conduct

1. Hormati semua penyumbang
2. Berikan feedback yang konstruktif
3. Fokus pada apa yang terbaik untuk komuniti
4. Gunakan Bahasa Melayu atau English dalam komunikasi
5. Laporkan isu dengan jelas dan terperinci

---

Terima kasih atas sumbangan anda! 🤲

*Semoga memberi manfaat kepada ummah.*
