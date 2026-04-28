import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { sendContactNotification } from '../../services/email.service.js'

const bodySchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(5).max(5000),
})

const contactRoutes: FastifyPluginAsync = async (server) => {
  server.post('/contact', async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректные данные', details: parsed.error.flatten() })
    }

    const { name, email, message } = parsed.data

    await server.prisma.contactMessage.create({ data: { name, email, message } })

    sendContactNotification({ name, email, message })
      .catch((err) => server.log.error({ err }, 'Failed to send contact notification email'))

    return { ok: true }
  })
}

export default contactRoutes
