import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../middleware/auth.js'
import { parseBuffer, importComponents, generateTemplate } from '../../services/import.service.js'

const adminImportRoutes: FastifyPluginAsync = async (server) => {
  // Download template — public, no auth needed
  server.get<{ Querystring: { format?: string } }>(
    '/admin/import/template',
    async (request, reply) => {
      const format = request.query.format === 'xlsx' ? 'xlsx' : 'json'
      const buf = generateTemplate(format)
      const filename = `template.${format}`
      const mime = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/json'
      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      reply.header('Content-Type', mime)
      return reply.send(buf)
    }
  )

  // Parse file and return preview rows (no DB write)
  server.post('/admin/import/preview', { preHandler: requireAdmin }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'Файл не загружен' })

    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)

    try {
      const rows = parseBuffer(buffer, data.filename)
      return { rows }
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message })
    }
  })

  // Confirm import — receives rows as JSON array
  server.post(
    '/admin/import/confirm',
    { preHandler: requireAdmin },
    async (request, reply) => {
      const body = request.body
      if (!Array.isArray(body) || body.length === 0) {
        return reply.code(400).send({ error: 'Нет данных для импорта' })
      }

      try {
        const result = await importComponents(server.prisma, body)
        return result
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message })
      }
    }
  )
}

export default adminImportRoutes
