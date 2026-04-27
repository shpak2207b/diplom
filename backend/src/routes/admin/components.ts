import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../../middleware/auth.js'

const adminComponentsRoutes: FastifyPluginAsync = async (server) => {
  // List components
  server.get('/admin/components', { preHandler: requireAdmin }, async (request) => {
    const { q = '', page = '1', limit = '50' } = request.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)))
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
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
      }),
      server.prisma.component.count({ where }),
    ])

    return { items, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
  })

  // Update component
  server.put<{ Params: { id: string } }>('/admin/components/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    const parsed = z.object({
      partNumber: z.string().min(1).max(100).optional(),
      manufacturer: z.string().max(100).optional(),
      quantity: z.number().int().min(0).optional(),
      description: z.string().max(5000).nullable().optional(),
    }).safeParse(request.body)

    if (!parsed.success) return reply.code(400).send({ error: 'Некорректные данные' })

    const component = await server.prisma.component.update({
      where: { id },
      data: parsed.data,
    })
    return component
  })

  // Delete component
  server.delete<{ Params: { id: string } }>('/admin/components/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    try {
      await server.prisma.component.delete({ where: { id } })
      return { ok: true }
    } catch {
      return reply.code(404).send({ error: 'Компонент не найден' })
    }
  })

  // Create component
  server.post('/admin/components', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = z.object({
      partNumber: z.string().min(1).max(100),
      manufacturer: z.string().max(100).default(''),
      quantity: z.number().int().min(0).default(0),
      description: z.string().max(5000).optional(),
    }).safeParse(request.body)

    if (!parsed.success) return reply.code(400).send({ error: 'Некорректные данные' })

    const component = await server.prisma.component.create({ data: parsed.data })
    return reply.code(201).send(component)
  })
}

export default adminComponentsRoutes
