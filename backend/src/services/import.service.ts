import { PrismaClient } from '@prisma/client'
import { parse } from 'csv-parse'
import * as XLSX from 'xlsx'
import { Readable } from 'stream'

interface ComponentRow {
  part_number: string
  manufacturer: string
  quantity: number
}

function normalizeRow(row: Record<string, string>): ComponentRow | null {
  // Support both CSV/XLSX column name variants
  const partNumber =
    row['part_number'] || row['partNumber'] || row['Парт номер'] || row['part number'] || ''
  const manufacturer =
    row['manufacturer'] || row['Производитель'] || row['mfg'] || ''
  const quantityRaw =
    row['quantity'] || row['Количество'] || row['qty'] || '0'
  const quantity = parseInt(quantityRaw, 10)

  if (!partNumber.trim()) return null

  return {
    part_number: partNumber.trim(),
    manufacturer: manufacturer.trim(),
    quantity: isNaN(quantity) ? 0 : quantity,
  }
}

async function parseCsv(buffer: Buffer): Promise<ComponentRow[]> {
  return new Promise((resolve, reject) => {
    const rows: ComponentRow[] = []
    const stream = Readable.from(buffer)

    stream
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', (row: Record<string, string>) => {
        const normalized = normalizeRow(row)
        if (normalized) rows.push(normalized)
      })
      .on('end', () => resolve(rows))
      .on('error', reject)
  })
}

function parseXlsx(buffer: Buffer): ComponentRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  return raw.map(normalizeRow).filter((r): r is ComponentRow => r !== null)
}

export async function importComponents(
  prisma: PrismaClient,
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<{ inserted: number; errors: string[] }> {
  let rows: ComponentRow[]

  const isXlsx =
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel') ||
    filename.endsWith('.xlsx') ||
    filename.endsWith('.xls')

  try {
    rows = isXlsx ? parseXlsx(buffer) : await parseCsv(buffer)
  } catch (err) {
    throw new Error(`Ошибка парсинга файла: ${(err as Error).message}`)
  }

  if (rows.length === 0) {
    throw new Error('Файл не содержит данных. Проверьте заголовки колонок: part_number, manufacturer, quantity')
  }

  const BATCH = 500
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    try {
      const result = await prisma.component.createMany({
        data: batch.map((r) => ({
          partNumber: r.part_number,
          manufacturer: r.manufacturer,
          quantity: r.quantity,
        })),
        skipDuplicates: false,
      })
      inserted += result.count
    } catch (err) {
      errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${(err as Error).message}`)
    }
  }

  return { inserted, errors }
}
