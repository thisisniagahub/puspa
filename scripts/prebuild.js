// ============================================================
// Prebuild Script — Loads .env.production & pushes Prisma schema
// This runs during Vercel build to create/update database tables
// before Next.js builds the application.
// ============================================================

/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;

      const key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
    console.log(`[prebuild] Loaded environment from ${filePath}`);
    return true;
  } catch (e) {
    console.log(`[prebuild] ${filePath} not found, using existing env vars`);
    return false;
  }
}

function main() {
  console.log('[prebuild] Starting prebuild setup...');

  if (process.env.PUSPA_LOAD_ENV_FILE === 'true') {
    loadEnvFile(path.join(process.cwd(), '.env.production'));
  } else {
    console.log('[prebuild] Skipping .env.production load. Expecting env vars from deployment secret manager.');
  }

  const shouldPushSchema = process.env.PUSPA_ENABLE_SCHEMA_PUSH === 'true';
  const isVercel = process.env.VERCEL === '1';

  if (!shouldPushSchema) {
    console.log('[prebuild] Schema push disabled. Set PUSPA_ENABLE_SCHEMA_PUSH=true only for environments that can reach the database safely.');
    if (isVercel) {
      console.log('[prebuild] Vercel build detected, skipping prisma db push by default.');
    }
    process.exit(0);
  }

  // Verify DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('[prebuild] WARNING: No DATABASE_URL found. Skipping schema push.');
    console.log('[prebuild] Tables must be created manually or via deployment env vars.');
    process.exit(0);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl.includes('[YOUR-DB-PASSWORD]') || dbUrl.includes('db.example.supabase.co')) {
    console.log('[prebuild] Placeholder DATABASE_URL detected. Skipping schema push.');
    process.exit(0);
  }

  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

  if (!isPostgres) {
    console.log('[prebuild] DATABASE_URL is not PostgreSQL. Skipping schema push.');
    console.log(`[prebuild] URL prefix: ${dbUrl.substring(0, 15)}...`);
    process.exit(0);
  }

  console.log('[prebuild] PostgreSQL detected. Pushing schema to database...');

  const safeUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`[prebuild] Connecting to: ${safeUrl}`);

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env },
    timeout: 60000,
  });
  console.log('[prebuild] Schema pushed successfully!');
}

main();
