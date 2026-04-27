/**
 * Creates the initial admin user.
 * Usage: DATABASE_URL=... npx tsx seed-admin.ts
 * Or set ADMIN_USERNAME and ADMIN_PASSWORD env vars (defaults: admin / changeme123)
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const username = process.env.ADMIN_USERNAME ?? 'admin'
const password = process.env.ADMIN_PASSWORD ?? 'changeme123'

async function main() {
  const hash = await bcrypt.hash(password, 12)

  const user = await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: hash },
    create: { username, passwordHash: hash },
  })

  console.log(`✅ Admin user ready: ${user.username} (id: ${user.id})`)
  console.log(`   Password: ${password}`)
  console.log('   ⚠️  Change the password in production!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
