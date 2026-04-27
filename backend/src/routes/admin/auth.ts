import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const authRoutes: FastifyPluginAsync = async (server) => {
  server.post('/admin/login', async (request, reply) => {
    const parsed = z
      .object({ username: z.string(), password: z.string() })
      .safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректные данные' })
    }

    const { username, password } = parsed.data

    const user = await server.prisma.adminUser.findUnique({ where: { username } })
    if (!user) {
      return reply.code(401).send({ error: 'Неверный логин или пароль' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'Неверный логин или пароль' })
    }

    const token = server.jwt.sign({ id: user.id, username: user.username, scope: 'admin' }, { expiresIn: '24h' })

    return { ok: true, token }
  })
}

export default authRoutes
