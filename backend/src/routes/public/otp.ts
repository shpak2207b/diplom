import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { generateOtp, storeOtp, verifyOtp } from '../../services/otp.service.js'
import { sendOtp } from '../../services/email.service.js'

const otpRoutes: FastifyPluginAsync = async (server) => {
  server.post('/otp/request', async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректный email' })
    }

    const { email } = parsed.data
    const otp = generateOtp()

    await storeOtp(server.prisma, email, otp)
    await sendOtp(email, otp)

    return { ok: true, message: 'Код отправлен на указанный email' }
  })

  server.post('/otp/verify', async (request, reply) => {
    const parsed = z
      .object({ email: z.string().email(), code: z.string().length(6) })
      .safeParse(request.body)

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректные данные' })
    }

    const { email, code } = parsed.data
    const valid = await verifyOtp(server.prisma, email, code)

    if (!valid) {
      return reply.code(400).send({ error: 'Неверный или устаревший код' })
    }

    // Short-lived token (15 min) with otp-verified scope
    const token = server.jwt.sign({ email, scope: 'otp-verified' }, { expiresIn: '15m' })

    return { ok: true, token }
  })
}

export default otpRoutes
