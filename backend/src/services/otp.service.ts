import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function storeOtp(prisma: PrismaClient, email: string, otp: string): Promise<void> {
  // Invalidate any existing unused OTPs for this email
  await prisma.emailVerification.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min
  await prisma.emailVerification.create({
    data: { email, token: otp, expiresAt },
  })
}

export async function verifyOtp(
  prisma: PrismaClient,
  email: string,
  otp: string,
): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      token: otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  if (!record) return false

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { used: true },
  })

  return true
}
