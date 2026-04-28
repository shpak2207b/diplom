import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { config } from '../../config.js'
import { sendOrderNotification } from '../../services/email.service.js'

async function verifyCaptcha(token: string): Promise<boolean> {
  if (!config.TURNSTILE_SECRET) return true // dev mode — skip
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.TURNSTILE_SECRET, response: token }),
  })
  const data = (await res.json()) as { success: boolean }
  return data.success
}

const cartItemSchema = z.object({
  partNumber: z.string().min(1).max(100),
  manufacturer: z.string().max(100).default(''),
  quantity: z.number().int().positive(),
})

const orderBodySchema = z.object({
  captchaToken: z.string().min(1),
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

    const { captchaToken, customerName, customerEmail, customerPhone, companyName, comment, items } =
      parsed.data

    const captchaOk = await verifyCaptcha(captchaToken)
    if (!captchaOk) {
      return reply.code(400).send({ error: 'Проверка CAPTCHA не пройдена. Попробуйте ещё раз.' })
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
            componentId: null,
            partNumber: i.partNumber,
            manufacturer: i.manufacturer,
            quantityRequested: i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    sendOrderNotification({
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
    }).catch((err) => server.log.error({ err }, 'Failed to send order notification email'))

    return { ok: true, orderId: order.id }
  })
}

export default ordersRoutes
