import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from '../../middleware/auth.js'

async function resolveManufacturerId(
  prisma: Parameters<FastifyPluginAsync>[0]['prisma'],
  name: string | undefined | null,
): Promise<number | null> {
  if (!name?.trim()) return null
  const mfg = await prisma.manufacturer.upsert({
    where: { name: name.trim() },
    create: { name: name.trim() },
    update: {},
  })
  return mfg.id
}

const includeManufacturer = { manufacturer: { select: { name: true } } } as const

function flatComponent(c: { manufacturer: { name: string } | null; [k: string]: unknown }) {
  return { ...c, manufacturer: c.manufacturer?.name ?? '' }
}

const adminComponentsRoutes: FastifyPluginAsync = async (server) => {
  server.get('/admin/components', { preHandler: requireAdmin }, async (request) => {
    const { q = '', page = '1', limit = '50' } = request.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page, 10))
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)))
    const skip = (pageNum - 1) * limitNum

    const where = q.trim()
      ? {
          OR: [
            { partNumber: { contains: q, mode: 'insensitive' as const } },
            { manufacturer: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
          ],
        }
      : {}

    const [raw, total] = await Promise.all([
      server.prisma.component.findMany({ where, include: includeManufacturer, skip, take: limitNum, orderBy: { id: 'asc' } }),
      server.prisma.component.count({ where }),
    ])

    return { items: raw.map(flatComponent), total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
  })

  server.put<{ Params: { id: string } }>('/admin/components/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    const parsed = z.object({
      partNumber: z.string().min(1).max(100).optional(),
      manufacturer: z.string().max(100).optional(),
      quantity: z.number().int().min(0).optional(),
      package: z.string().max(100).nullable().optional(),
      category: z.string().max(100).nullable().optional(),
      description: z.string().max(5000).nullable().optional(),
    }).safeParse(request.body)

    if (!parsed.success) return reply.code(400).send({ error: 'Некорректные данные' })

    const { manufacturer: manufacturerName, ...rest } = parsed.data
    const manufacturerId = await resolveManufacturerId(server.prisma, manufacturerName)

    const component = await server.prisma.component.update({
      where: { id },
      data: { ...rest, ...(manufacturerName !== undefined ? { manufacturerId } : {}) },
      include: includeManufacturer,
    })
    return flatComponent(component)
  })

  server.delete<{ Params: { id: string } }>('/admin/components/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const id = parseInt(request.params.id, 10)
    try {
      await server.prisma.component.delete({ where: { id } })
      return { ok: true }
    } catch {
      return reply.code(404).send({ error: 'Компонент не найден' })
    }
  })

  server.post('/admin/components', { preHandler: requireAdmin }, async (request, reply) => {
    const parsed = z.object({
      partNumber: z.string().min(1).max(100),
      manufacturer: z.string().max(100).default(''),
      quantity: z.number().int().min(0).default(0),
      package: z.string().max(100).optional(),
      category: z.string().max(100).optional(),
      description: z.string().max(5000).optional(),
    }).safeParse(request.body)

    if (!parsed.success) return reply.code(400).send({ error: 'Некорректные данные' })

    const { manufacturer: manufacturerName, ...rest } = parsed.data
    const manufacturerId = await resolveManufacturerId(server.prisma, manufacturerName)

    const component = await server.prisma.component.create({
      data: { ...rest, manufacturerId },
      include: includeManufacturer,
    })
    return reply.code(201).send(flatComponent(component))
  })
}

export default adminComponentsRoutes
