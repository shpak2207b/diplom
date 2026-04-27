import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const SQLITE_PATH = process.env.SQLITE_PATH ?? path.resolve('../../diplom/components.db')
const BATCH_SIZE = 1000

const prisma = new PrismaClient()

interface SqliteRow {
  id: number
  part_number: string
  manufacturer: string
  quantity: number
}

console.log(`📂 SQLite: ${SQLITE_PATH}`)
const sqlite = new Database(SQLITE_PATH, { readonly: true })

const totalRow = sqlite.prepare('SELECT COUNT(*) as cnt FROM parts').get() as { cnt: number }
console.log(`📊 Записей: ${totalRow.cnt}`)

const existing = await prisma.component.count()
if (existing > 0) {
  console.log(`⚠️  В PostgreSQL уже ${existing} записей. Пропускаю.`)
  sqlite.close()
  await prisma.$disconnect()
  process.exit(0)
}

const rows = sqlite.prepare('SELECT id, part_number, manufacturer, quantity FROM parts ORDER BY id').all() as SqliteRow[]
const total = rows.length
let inserted = 0
const start = Date.now()

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE)
  await prisma.component.createMany({
    data: batch.map(r => ({
      partNumber: r.part_number || '',
      manufacturer: r.manufacturer || '',
      quantity: parseInt(String(r.quantity ?? 0), 10) || 0,
    })),
  })
  inserted += batch.length
  process.stdout.write(`\r  ${inserted}/${total} (${((inserted/total)*100).toFixed(1)}%) — ${((Date.now()-start)/1000).toFixed(0)}s`)
}

console.log(`\n✅ Готово: ${inserted} записей за ${((Date.now()-start)/1000).toFixed(1)}s`)
sqlite.close()
await prisma.$disconnect()
