import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const username = process.env.ADMIN_USERNAME ?? 'admin'
const password = process.env.ADMIN_PASSWORD ?? 'changeme123'

const hash = await bcrypt.hash(password, 12)
const user = await prisma.adminUser.upsert({
  where: { username },
  update: { passwordHash: hash },
  create: { username, passwordHash: hash },
})
console.log(`✅ Admin: ${user.username} / ${password}`)
await prisma.$disconnect()
