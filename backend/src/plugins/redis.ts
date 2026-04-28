import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { config } from '../config.js'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

export default fp(async (server) => {
  const redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 })

  try {
    await redis.connect()
    server.log.info('Redis connected')
  } catch {
    server.log.warn('Redis unavailable, caching disabled')
  }

  server.decorate('redis', redis)
  server.addHook('onClose', () => redis.quit())
})
