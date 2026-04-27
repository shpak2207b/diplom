import './config.js' // validate env first
import { config } from './config.js'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'

import prismaPlugin from './plugins/prisma.js'

// Public routes
import catalogRoutes from './routes/public/catalog.js'
import contactRoutes from './routes/public/contact.js'
import otpRoutes from './routes/public/otp.js'
import ordersRoutes from './routes/public/orders.js'
import efindRoutes from './routes/public/efind.js'

// Admin routes
import authRoutes from './routes/admin/auth.js'
import dashboardRoutes from './routes/admin/dashboard.js'
import adminOrdersRoutes from './routes/admin/orders.js'
import adminComponentsRoutes from './routes/admin/components.js'
import adminImportRoutes from './routes/admin/import.js'

const server = Fastify({ logger: config.NODE_ENV === 'development' })

await server.register(cors, {
  origin: config.NODE_ENV === 'development' ? true : [/unixplus\.su$/, /localhost/],
  credentials: true,
})

await server.register(jwt, { secret: config.JWT_SECRET })

await server.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }) // 50MB

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => req.ip,
})

await server.register(prismaPlugin)

// Apply stricter rate limit to OTP endpoint
await server.register(
  async (instance) => {
    await instance.register(rateLimit, {
      max: 3,
      timeWindow: '1 minute',
      keyGenerator: (req) => {
        const body = req.body as { email?: string } | undefined
        return `otp:${req.ip}:${body?.email ?? ''}`
      },
      errorResponseBuilder: () => ({
        error: 'Слишком много запросов. Подождите 1 минуту.',
      }),
    })
    await instance.register(otpRoutes, { prefix: '/api' })
  },
)

// Register all other routes
await server.register(catalogRoutes, { prefix: '/api' })
await server.register(contactRoutes, { prefix: '/api' })
await server.register(ordersRoutes, { prefix: '/api' })
await server.register(efindRoutes, { prefix: '/api' })

await server.register(authRoutes, { prefix: '/api' })
await server.register(dashboardRoutes, { prefix: '/api' })
await server.register(adminOrdersRoutes, { prefix: '/api' })
await server.register(adminComponentsRoutes, { prefix: '/api' })
await server.register(adminImportRoutes, { prefix: '/api' })

server.get('/api/health', async () => ({ ok: true }))

try {
  await server.listen({ port: config.BACKEND_PORT, host: '0.0.0.0' })
  console.log(`🚀 Backend running on http://0.0.0.0:${config.BACKEND_PORT}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
