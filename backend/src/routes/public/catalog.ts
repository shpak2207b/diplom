import { FastifyPluginAsync } from 'fastify'

const CACHE_TTL = 300

const select = {
  id: true,
  partNumber: true,
  manufacturer: { select: { id: true, name: true } },
  quantity: true,
  package: true,
  category: true,
  description: true,
} as const

function flat(c: {
  id: number
  partNumber: string
  manufacturer: { id: number; name: string } | null
  quantity: number
  package: string | null
  category: string | null
  description: string | null
}) {
  return { ...c, manufacturer: c.manufacturer?.name ?? '' }
}

const catalogRoutes: FastifyPluginAsync = async (server) => {
  server.get('/catalog/manufacturers', async () => {
    const key = 'catalog:manufacturers'
    try { const c = await server.redis.get(key); if (c) return JSON.parse(c) } catch { /* noop */ }

    const rows = await server.prisma.manufacturer.findMany({ orderBy: { name: 'asc' }, select: { name: true } })
    const list = rows.map((r) => r.name)

    try { await server.redis.set(key, JSON.stringify(list), 'EX', CACHE_TTL) } catch { /* noop */ }
    return list
  })

  server.get('/catalog', async (request) => {
    const { q = '', page = '1', limit = '25', category = '', manufacturer = '' } =
      request.query as Record<string, string>

    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const key = `catalog:${q}:${manufacturer}:${category}:${pageNum}:${limitNum}`
    try { const c = await server.redis.get(key); if (c) return JSON.parse(c) } catch { /* noop */ }

    const where: Record<string, unknown> = {}

    if (q.trim()) {
      where.OR = [
        { partNumber: { contains: q, mode: 'insensitive' as const } },
        { manufacturer: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ]
    }
    if (manufacturer.trim()) {
      where.manufacturer = { is: { name: { startsWith: manufacturer, mode: 'insensitive' as const } } }
    }
    if (category.trim()) {
      where.category = { equals: category, mode: 'insensitive' as const }
    }

    const [raw, total] = await Promise.all([
      server.prisma.component.findMany({ where, select, skip, take: limitNum, orderBy: { id: 'asc' } }),
      server.prisma.component.count({ where }),
    ])

    const result = { items: raw.map(flat), total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }

    try { await server.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL) } catch { /* noop */ }
    return result
  })

  server.get('/search', async (request) => {
    const { query = '', limit = '25' } = request.query as Record<string, string>

    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const q = query.trim()

    const where = q ? {
      OR: [
        { partNumber: { contains: q, mode: 'insensitive' as const } },
        { manufacturer: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}

    const [raw, total] = await Promise.all([
      server.prisma.component.findMany({ where, select, take: limitNum, orderBy: { id: 'asc' } }),
      server.prisma.component.count({ where }),
    ])

    return { items: raw.map(flat), total, limit: limitNum }
  })
}

export default catalogRoutes
