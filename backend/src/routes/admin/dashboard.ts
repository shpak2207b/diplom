import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../middleware/auth.js'

const dashboardRoutes: FastifyPluginAsync = async (server) => {
  server.get('/admin/dashboard', { preHandler: requireAdmin }, async () => {
    const [totalOrders, newOrders, totalComponents, newMessages, recentMessages] = await Promise.all([
      server.prisma.order.count(),
      server.prisma.order.count({ where: { status: 'NEW' } }),
      server.prisma.component.count(),
      server.prisma.contactMessage.count({ where: { archived: false } }),
      server.prisma.contactMessage.findMany({
        where: { archived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, message: true, createdAt: true },
      }),
    ])

    return { totalOrders, newOrders, totalComponents, newMessages, recentMessages }
  })
}

export default dashboardRoutes
