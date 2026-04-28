import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import * as XLSX from 'xlsx'

const rowSchema = z.object({
  partNumber: z.string().min(1).max(100),
  manufacturer: z.string().max(100).default(''),
  quantity: z.coerce.number().int().min(0).default(0),
  package: z.string().max(100).optional().default(''),
  category: z.string().max(100).optional().default(''),
  description: z.string().max(1000).optional().default(''),
})

export type ImportRow = z.infer<typeof rowSchema>

export function parseBuffer(buffer: Buffer, filename: string): ImportRow[] {
  const ext = filename.split('.').pop()?.toLowerCase()

  let rawRows: unknown[]

  if (ext === 'json') {
    let parsed: unknown
    try {
      parsed = JSON.parse(buffer.toString('utf-8'))
    } catch {
      throw new Error('Файл не является валидным JSON')
    }
    if (!Array.isArray(parsed)) throw new Error('JSON должен содержать массив объектов')
    rawRows = parsed
  } else if (ext === 'xlsx' || ext === 'xls') {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  } else {
    throw new Error('Поддерживаются только .json и .xlsx файлы')
  }

  if (rawRows.length === 0) throw new Error('Файл не содержит данных')

  const rows: ImportRow[] = []
  const errors: string[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = rowSchema.safeParse(rawRows[i])
    if (parsed.success) {
      rows.push(parsed.data)
    } else {
      errors.push(`Строка ${i + 1}: ${parsed.error.issues.map((e) => e.message).join(', ')}`)
    }
  }

  if (errors.length > 0 && rows.length === 0) {
    throw new Error(`Ошибки валидации: ${errors.slice(0, 3).join('; ')}`)
  }

  return rows
}

export async function importComponents(
  prisma: PrismaClient,
  rawRows: unknown[],
): Promise<{ upserted: number; errors: string[] }> {
  const errors: string[] = []
  const rows: ImportRow[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const parsed = rowSchema.safeParse(rawRows[i])
    if (parsed.success) {
      rows.push(parsed.data)
    } else {
      const msg = parsed.error.issues.map((e) => e.message).join(', ')
      errors.push(`Строка ${i + 1}: ${msg}`)
    }
  }

  if (rows.length === 0) {
    return { upserted: 0, errors: errors.length > 0 ? errors : ['Нет корректных строк для импорта'] }
  }

  const uniqueNames = [...new Set(rows.map((r) => r.manufacturer).filter(Boolean))]
  const mfgMap = new Map<string, number>()
  for (const name of uniqueNames) {
    const mfg = await prisma.manufacturer.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    mfgMap.set(name, mfg.id)
  }

  let upserted = 0

  // Fetch all existing partNumbers in one query
  const partNumbers = rows.map((r) => r.partNumber)
  const existing = await prisma.component.findMany({
    where: { partNumber: { in: partNumbers } },
    select: { id: true, partNumber: true },
  })
  const existingMap = new Map(existing.map((c) => [c.partNumber, c.id]))

  const toCreate = rows.filter((r) => !existingMap.has(r.partNumber))
  const toUpdate = rows.filter((r) => existingMap.has(r.partNumber))

  // Batch create new components
  if (toCreate.length > 0) {
    try {
      const res = await prisma.component.createMany({
        data: toCreate.map((r) => ({
          partNumber: r.partNumber,
          manufacturerId: r.manufacturer ? (mfgMap.get(r.manufacturer) ?? null) : null,
          quantity: r.quantity,
          package: r.package || null,
          category: r.category || null,
          description: r.description || null,
        })),
        skipDuplicates: true,
      })
      upserted += res.count
    } catch (err) {
      errors.push(`Создание новых: ${(err as Error).message}`)
    }
  }

  // Update existing components in parallel batches
  const updateResults = await Promise.allSettled(
    toUpdate.map((r) =>
      prisma.component.update({
        where: { id: existingMap.get(r.partNumber)! },
        data: {
          manufacturerId: r.manufacturer ? (mfgMap.get(r.manufacturer) ?? null) : null,
          quantity: r.quantity,
          package: r.package || null,
          category: r.category || null,
          description: r.description || null,
        },
      })
    )
  )

  for (let i = 0; i < updateResults.length; i++) {
    if (updateResults[i].status === 'fulfilled') {
      upserted++
    } else {
      errors.push(`${toUpdate[i].partNumber}: ${(updateResults[i] as PromiseRejectedResult).reason?.message}`)
    }
  }

  return { upserted, errors }
}

export function generateTemplate(format: 'json' | 'xlsx'): Buffer {
  const sample = [
    { partNumber: 'LM358N', manufacturer: 'Texas Instruments', quantity: 100, package: 'DIP-8', category: 'Усилители', description: 'Двойной операционный усилитель' },
    { partNumber: 'STM32F103C8T6', manufacturer: 'STMicroelectronics', quantity: 50, package: 'LQFP-48', category: 'Микроконтроллеры', description: '' },
  ]

  if (format === 'json') {
    return Buffer.from(JSON.stringify(sample, null, 2), 'utf-8')
  }

  const ws = XLSX.utils.json_to_sheet(sample)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Компоненты')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
