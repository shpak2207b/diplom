/**
 * One-time migration: SQLite components.db → PostgreSQL
 * Usage: DATABASE_URL=... SQLITE_PATH=../diplom/components.db npx tsx migrate-sqlite-to-pg.ts
 */
import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const SQLITE_PATH = process.env.SQLITE_PATH ?? path.resolve('../diplom/components.db')
const BATCH_SIZE = 1000

const prisma = new PrismaClient()

interface SqliteRow {
  id: number
  part_number: string
  manufacturer: string
  quantity: number
}

async function main() {
  console.log(`📂 Opening SQLite: ${SQLITE_PATH}`)
  const sqlite = new Database(SQLITE_PATH, { readonly: true })

  const totalRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM parts').get() as { cnt: number }
  const total = totalRow.cnt
  console.log(`📊 Total records: ${total}`)

  // Check if already migrated
  const existing = await prisma.component.count()
  if (existing > 0) {
    console.log(`⚠️  PostgreSQL already has ${existing} records. Skipping migration.`)
    console.log('   Delete all components first if you want to re-run: DELETE FROM components;')
    sqlite.close()
    await prisma.$disconnect()
    return
  }

  const rows = sqlite.prepare('SELECT id, part_number, manufacturer, quantity FROM parts ORDER BY id').all() as SqliteRow[]

  let inserted = 0
  const startTime = Date.now()

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    await prisma.component.createMany({
      data: batch.map((r) => ({
        partNumber: r.part_number || '',
        manufacturer: r.manufacturer || '',
        quantity: r.quantity ?? 0,
      })),
    })
    inserted += batch.length
    const pct = ((inserted / total) * 100).toFixed(1)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    process.stdout.write(`\r  Progress: ${inserted}/${total} (${pct}%) — ${elapsed}s elapsed`)
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ Migration complete: ${inserted} records in ${elapsed}s`)

  sqlite.close()
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
