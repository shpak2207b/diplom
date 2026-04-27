import { FastifyPluginAsync } from 'fastify'

const efindRoutes: FastifyPluginAsync = async (server) => {
  server.get('/efind', async (request, reply) => {
    const { search, q } = request.query as { search?: string; q?: string }
    const query = (search || q || '').trim()

    if (!query) {
      reply.header('Content-Type', 'text/xml; charset=utf-8')
      return reply.send('<?xml version="1.0" encoding="UTF-8"?><data version="2.0"></data>')
    }

    const results = await server.prisma.component.findMany({
      where: {
        OR: [
          { partNumber: { contains: query, mode: 'insensitive' } },
          { manufacturer: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { partNumber: true, manufacturer: true, quantity: true },
    })

    const items = results
      .map(
        (r) => `  <item>
    <part>${escapeXml(r.partNumber)}</part>
    <mfg>${escapeXml(r.manufacturer)}</mfg>
    <pb quantity="1">0.00</pb>
    <cur>RUB</cur>
    <stock>${r.quantity}</stock>
    <dlv>2-5 дней</dlv>
    <instock>1</instock>
    <note>Оригинал, под заказ</note>
  </item>`,
      )
      .join('\n')

    reply.header('Content-Type', 'text/xml; charset=utf-8')
    return reply.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<data version="2.0">\n${items}\n</data>`,
    )
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default efindRoutes
