import { FastifyPluginAsync } from 'fastify'
import { requireAdmin } from '../../middleware/auth.js'
import { importComponents } from '../../services/import.service.js'

const adminImportRoutes: FastifyPluginAsync = async (server) => {
  server.post('/admin/import', { preHandler: requireAdmin }, async (request, reply) => {
    const data = await request.file()
    if (!data) {
      return reply.code(400).send({ error: 'Файл не загружен' })
    }

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    try {
      const result = await importComponents(
        server.prisma,
        buffer,
        data.mimetype,
        data.filename,
      )
      return result
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message })
    }
  })
}

export default adminImportRoutes
