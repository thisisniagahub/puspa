import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient, type Client } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const isTurso = process.env.DATABASE_URL?.startsWith('libsql://')

  if (isTurso) {
    // Vercel / Turso: Use libSQL adapter for serverless compatibility
    const libsql: Client = createClient({
      url: process.env.DATABASE_URL!,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local dev: Use native SQLite (file-based)
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
