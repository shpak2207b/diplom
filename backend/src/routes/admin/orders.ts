import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../../middleware/auth.js'

const adminOrdersRoutes: FastifyPluginAsync = async (server) => {
  // List orders
  server.get('/admin/orders', { preHandler: requireAdmin }, async (request) => {
    const { status, page = '1', limit = '20' } = request.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const { excludeStatus } = request.query as Record<string, string>
    let where: Record<string, unknown> = {}
    if (status) {
      where = { status: status as any }
    } else if (excludeStatus) {
      where = { status: { not: excludeStatus as any } }
    }

    const [orders, total] = await Promise.all([
      server.prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { items: { select: { id: true, partNumber: true, manufacturer: true, quantityRequested: true } } },
      }),
      server.prisma.order.count({ where }),
    ])

    return { orders, total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
  })

  // Get single order
  server.get<{ Params: { id: string } }>('/admin/orders/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    const order = await server.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return reply.code(404).send({ error: 'Заявка не найдена' })
    return order
  })

  // Update order status
  server.patch<{ Params: { id: string } }>('/admin/orders/:id/status', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    const parsed = z.object({ status: z.enum(['NEW', 'PROCESSED', 'COMPLETED', 'ARCHIVED']) }).safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Некорректный статус' })

    const order = await server.prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
    })
    return order
  })

  // Delete order
  server.delete<{ Params: { id: string } }>('/admin/orders/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    try {
      await server.prisma.order.delete({ where: { id } })
      return { ok: true }
    } catch {
      return reply.code(404).send({ error: 'Заявка не найдена' })
    }
  })
}

export default adminOrdersRoutes
