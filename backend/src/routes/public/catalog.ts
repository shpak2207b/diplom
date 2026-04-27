import { FastifyPluginAsync } from 'fastify'

const catalogRoutes: FastifyPluginAsync = async (server) => {
  server.get('/catalog', async (request, reply) => {
    const { q = '', page = '1', limit = '25' } = request.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const where = q.trim()
      ? {
          OR: [
            { partNumber: { contains: q, mode: 'insensitive' as const } },
            { manufacturer: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      server.prisma.component.findMany({
        where,
        select: { id: true, partNumber: true, manufacturer: true, quantity: true },
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
      }),
      server.prisma.component.count({ where }),
    ])

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    }
  })
}

export default catalogRoutes
