import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../middleware/auth.js'

const adminMessagesRoutes: FastifyPluginAsync = async (server) => {
  server.get('/admin/messages', { preHandler: requireAdmin }, async (request) => {
    const { page = '1', limit = '20', archived = 'false' } = request.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum
    const isArchived = archived === 'true'

    const [messages, total] = await Promise.all([
      server.prisma.contactMessage.findMany({
        where: { archived: isArchived },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      server.prisma.contactMessage.count({ where: { archived: isArchived } }),
    ])

    return { messages, total, page: pageNum }
  })

  server.patch<{ Params: { id: string } }>(
    '/admin/messages/:id/archive',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10)
      try {
        await server.prisma.contactMessage.update({ where: { id }, data: { archived: true } })
        return { ok: true }
      } catch {
        return reply.code(404).send({ error: 'Сообщение не найдено' })
      }
    }
  )

  server.delete<{ Params: { id: string } }>(
    '/admin/messages/:id',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10)
      try {
        await server.prisma.contactMessage.delete({ where: { id } })
        return { ok: true }
      } catch {
        return reply.code(404).send({ error: 'Сообщение не найдено' })
      }
    }
  )
}

export default adminMessagesRoutes
