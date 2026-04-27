import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { sendOrderNotification } from '../../services/email.service.js'

const cartItemSchema = z.object({
  componentId: z.number().int().positive().optional(),
  partNumber: z.string().min(1).max(100),
  manufacturer: z.string().max(100).default(''),
  quantity: z.number().int().positive(),
})

const orderBodySchema = z.object({
  token: z.string(),
  customerName: z.string().min(2).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(50).optional(),
  companyName: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  items: z.array(cartItemSchema).min(1).max(200),
})

const ordersRoutes: FastifyPluginAsync = async (server) => {
  server.post('/orders', async (request, reply) => {
    const parsed = orderBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Некорректные данные', details: parsed.error.flatten() })
    }

    const { token, customerName, customerEmail, customerPhone, companyName, comment, items } =
      parsed.data

    // Verify OTP token
    let payload: { email: string; scope: string }
    try {
      payload = server.jwt.verify(token) as { email: string; scope: string }
    } catch {
      return reply.code(401).send({ error: 'Недействительный токен. Пройдите проверку email заново.' })
    }

    if (payload.scope !== 'otp-verified') {
      return reply.code(401).send({ error: 'Недействительный токен' })
    }

    if (payload.email.toLowerCase() !== customerEmail.toLowerCase()) {
      return reply.code(400).send({ error: 'Email не совпадает с подтверждённым' })
    }

    const order = await server.prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        companyName,
        comment,
        items: {
          create: items.map((i) => ({
            componentId: i.componentId ?? null,
            partNumber: i.partNumber,
            manufacturer: i.manufacturer,
            quantityRequested: i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    await sendOrderNotification({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      companyName: order.companyName,
      comment: order.comment,
      items: order.items.map((i) => ({
        partNumber: i.partNumber,
        manufacturer: i.manufacturer,
        quantityRequested: i.quantityRequested,
      })),
    })

    return { ok: true, orderId: order.id }
  })
}

export default ordersRoutes
