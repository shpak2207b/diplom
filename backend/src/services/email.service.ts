import nodemailer from 'nodemailer'
import { config } from '../config.js'

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: config.SMTP_USER
    ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
    : undefined,
})

export async function sendOtp(email: string, otp: string): Promise<void> {
  if (!config.SMTP_HOST) {
    console.log(`[DEV] OTP for ${email}: ${otp}`)
    return
  }
  await transporter.sendMail({
    from: config.SMTP_FROM,
    to: email,
    subject: 'Код подтверждения — Юникс Плюс',
    text: `Ваш код подтверждения: ${otp}\n\nКод действителен 10 минут.\n\nЕсли вы не запрашивали этот код, проигнорируйте письмо.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#003366">Юникс Плюс</h2>
        <p>Ваш код подтверждения:</p>
        <h1 style="letter-spacing:8px;color:#003366;text-align:center">${otp}</h1>
        <p style="color:#666;font-size:14px">Код действителен 10 минут.</p>
      </div>
    `,
  })
}

export async function sendOrderNotification(order: {
  id: number
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  companyName?: string | null
  comment?: string | null
  items: Array<{ partNumber: string; manufacturer: string; quantityRequested: number }>
}): Promise<void> {
  if (!config.SMTP_HOST) {
    console.log(`[DEV] New order #${order.id} from ${order.customerEmail}`)
    return
  }

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td>${i.partNumber}</td><td>${i.manufacturer}</td><td>${i.quantityRequested}</td></tr>`,
    )
    .join('')

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to: config.ADMIN_EMAIL,
    subject: `Новая заявка #${order.id} — ${order.customerName}`,
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Новая заявка #${order.id}</h2>
        <p><b>Клиент:</b> ${order.customerName}</p>
        <p><b>Email:</b> ${order.customerEmail}</p>
        ${order.customerPhone ? `<p><b>Телефон:</b> ${order.customerPhone}</p>` : ''}
        ${order.companyName ? `<p><b>Компания:</b> ${order.companyName}</p>` : ''}
        ${order.comment ? `<p><b>Комментарий:</b> ${order.comment}</p>` : ''}
        <h3>Позиции:</h3>
        <table border="1" cellpadding="6" cellspacing="0">
          <tr><th>Парт номер</th><th>Производитель</th><th>Количество</th></tr>
          ${itemsHtml}
        </table>
      </div>
    `,
  })
}

export async function sendContactNotification(msg: {
  name: string
  email: string
  message: string
}): Promise<void> {
  if (!config.SMTP_HOST) {
    console.log(`[DEV] Contact from ${msg.email}: ${msg.message}`)
    return
  }
  await transporter.sendMail({
    from: config.SMTP_FROM,
    to: config.ADMIN_EMAIL,
    replyTo: msg.email,
    subject: `Сообщение с сайта от ${msg.name}`,
    text: `От: ${msg.name} <${msg.email}>\n\n${msg.message}`,
  })
}
