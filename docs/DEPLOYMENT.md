# DEPLOYMENT — Panduan Deployment

## PUSPA + OpenClaw Integrated Platform

> **Versi**: 1.0.0
> **Tarikh**: Julai 2025

---

## 1. Environments

| Environment | URL | Database | Status |
|---|---|---|---|
| **Local Development** | `http://localhost:3000` | SQLite | ✅ Active |
| **Production (Vercel)** | `https://puspa-chi.vercel.app` | Supabase PostgreSQL | ✅ Active |
| **Staging** | TBD | Supabase PostgreSQL | 🔲 Roadmap |

---

## 2. Local Development Setup

### 2.1 Prerequisites

```bash
# Required
Node.js >= 18
Bun >= 1.0  (recommended) atau npm >= 9 / yarn >= 1.22
Git

# Optional
Docker (for containerized development)
```

### 2.2 Installation

```bash
# 1. Clone repository
git clone https://github.com/thisisniagahub/puspa.git
cd puspa

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Setup database (SQLite - local)
mkdir -p db
bun run db:push

# 5. Seed database (optional)
bun run db:seed

# 6. Start development server
bun run dev
```

### 2.3 Environment Variables (Local)

```env
# .env
DATABASE_URL="file:../db/puspa.db"
```

### 2.4 Development Commands

```bash
bun run dev          # Start dev server (port 3000)
bun run lint         # ESLint check
bun run db:push      # Push Prisma schema to DB
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run Prisma migrations
bun run db:seed      # Seed sample data
bun run db:reset     # Reset database (destructive)
```

---

## 3. Production Deployment (Vercel)

### 3.1 Prerequisites

- Vercel account (free tier OK)
- Supabase account (free tier OK)
- GitHub repository connected

### 3.2 Supabase Setup

```bash
# 1. Create Supabase project at https://supabase.com
# 2. Get connection string from Settings > Database
# 3. Format: postgresql://user:password@host:port/database

# Example:
DATABASE_URL="postgresql://postgres.fahywepalxxyhnyetptq:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

### 3.3 Vercel Configuration

```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables in Vercel Dashboard:
DATABASE_URL="postgresql://postgres.fahywepalxxyhnyetptq:[SECRET]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# 3. Build settings (auto-detected):
#    Framework Preset: Next.js
#    Build Command: bun run build (or prisma generate && next build)
#    Output Directory: .next
#    Install Command: bun install

# 4. Deploy
#    Vercel auto-deploys on push to main branch
```

### 3.4 Database Migration (Production)

```bash
# Push schema to Supabase (run locally with production DATABASE_URL)
DATABASE_URL="postgresql://..." bun run db:push

# Or use Supabase SQL Editor to run migrations manually
```

### 3.5 Seed Production Database

```bash
# Send POST request to /api/seed on production
curl -X POST https://puspa-chi.vercel.app/api/seed
```

---

## 4. Database Migration: SQLite → Supabase

### 4.1 Step-by-Step

```bash
# 1. Update prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"       # Changed from "sqlite"
  url      = env("DATABASE_URL") # From environment variable
}

# 2. Remove SQLite-specific annotations
# (e.g., @default(cuid()) works for both, but @default(uuid()) better for Postgres)

# 3. Generate new Prisma client
bun run db:generate

# 4. Push schema to Supabase
bun run db:push

# 5. Verify in Supabase Dashboard > Table Editor
```

### 4.2 Data Migration (SQLite → Postgres)

```bash
# Option A: Use Prisma seed script
# Modify prisma/seed.ts to read from SQLite and write to Postgres

# Option B: Manual export/import
# 1. Export SQLite data to JSON
# 2. Transform JSON to match Supabase schema
# 3. Import via Supabase SQL Editor or API
```

---

## 5. Self-Hosted Deployment (Docker)

### 5.1 Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/puspa
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=puspa
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### 5.2 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 5.3 Deployment Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
bun run db:push  # Run against container's DB
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub Actions (Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint

  deploy:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 6.2 Required Secrets

| Secret | Penerangan |
|---|---|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `DATABASE_URL` | Supabase PostgreSQL connection string |

---

## 7. Monitoring & Maintenance

### 7.1 Health Checks

```bash
# Check if server is responding
curl -s -o /dev/null -w "%{http_code}" https://puspa-chi.vercel.app/
# Expected: 200

# Check API
curl -s https://puspa-chi.vercel.app/api/stats
# Expected: JSON with stats data
```

### 7.2 Database Maintenance

```bash
# Backup SQLite (local)
cp db/puspa.db db/puspa-backup-$(date +%Y%m%d).db

# Backup Supabase (production)
# Via Supabase Dashboard > Database > Backups
```

### 7.3 Log Monitoring

```bash
# Vercel logs
vercel logs puspa-chi --follow

# Supabase logs
# Via Supabase Dashboard > Logs
```

---

## 8. Security Checklist for Production

- [ ] Authentication implemented (NextAuth.js)
- [ ] Role-based access control active
- [ ] API rate limiting configured
- [ ] Environment variables in Vercel Vault (not in .env)
- [ ] CORS configured for allowed origins only
- [ ] HTTPS enforced (Vercel default)
- [ ] Input sanitization for markdown rendering (DOMPurify)
- [ ] Audit logging enabled
- [ ] Regular dependency audit (`bun audit` or `npm audit`)
- [ ] Database connection string encrypted
- [ ] Seed endpoint disabled in production (remove or add auth guard)

---

* Dokumen ini dikemaskini secara berkala.
