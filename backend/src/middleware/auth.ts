import { FastifyReply, FastifyRequest } from 'fastify'

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
    const payload = request.user as { scope?: string }
    if (payload.scope !== 'admin') {
      reply.code(403).send({ error: 'Недостаточно прав' })
    }
  } catch {
    reply.code(401).send({ error: 'Необходима авторизация' })
  }
}
