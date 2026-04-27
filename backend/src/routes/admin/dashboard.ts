import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../middleware/auth.js'

const dashboardRoutes: FastifyPluginAsync = async (server) => {
  server.get('/admin/dashboard', { preHandler: requireAdmin }, async () => {
    const [totalOrders, newOrders, totalComponents] = await Promise.all([
      server.prisma.order.count(),
      server.prisma.order.count({ where: { status: 'NEW' } }),
      server.prisma.component.count(),
    ])

    return { totalOrders, newOrders, totalComponents }
  })
}

export default dashboardRoutes
