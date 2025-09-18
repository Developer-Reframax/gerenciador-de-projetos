import nodemailer from 'nodemailer'
import { User } from '@/types/user'

// Interface para dados do webhook
interface WebhookEmailData {
  user: User
  temporaryPassword?: string
  emailType: 'welcome'
  timestamp: string
}

// Configuração do transporter do Nodemailer para Outlook
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp-mail.outlook.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // false para 587, true para 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

// Interface para dados do email
interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

// Função para enviar email
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Sistema de Gerenciamento de Projetos',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || '',
      },
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email enviado com sucesso:', result.messageId)
    return true
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return false
  }
}

// Função para enviar dados via webhook
export const sendWebhook = async (webhookData: WebhookEmailData): Promise<boolean> => {
  try {
    const webhookUrl = process.env.WEBHOOK_URL
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookUrl) {
      console.error('WEBHOOK_URL não configurada')
      return false
    }

    const payload = {
      ...webhookData,
      secret: webhookSecret,
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sistema-Gerenciamento-Projetos/1.0',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`)
    }

    console.log('Webhook enviado com sucesso:', response.status)
    return true
  } catch (error) {
    console.error('Erro ao enviar webhook:', error)
    return false
  }
}

// Template de email para novo usuário
export const generateWelcomeEmailTemplate = (user: User, temporaryPassword?: string) => {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Sistema de Gerenciamento de Projetos</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #2563eb;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f8fafc;
                padding: 30px;
                border-radius: 0 0 8px 8px;
            }
            .credentials {
                background-color: #e2e8f0;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                color: #64748b;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Bem-vindo!</h1>
        </div>
        <div class="content">
            <h2>Olá, ${user.full_name}!</h2>
            <p>Sua conta foi criada com sucesso no Sistema de Gerenciamento de Projetos.</p>
            
            <div class="credentials">
                <h3>Seus dados de acesso:</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                ${temporaryPassword ? `<p><strong>Senha temporária:</strong> ${temporaryPassword}</p>` : ''}
            </div>
            
            <p>Para acessar o sistema, clique no botão abaixo:</p>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">Acessar Sistema</a>
            
            ${temporaryPassword ? '<p><strong>Importante:</strong> Por segurança, altere sua senha no primeiro acesso.</p>' : ''}
            
            <p>Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte.</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda a esta mensagem.</p>
        </div>
    </body>
    </html>
  `

  const text = `
    Bem-vindo ao Sistema de Gerenciamento de Projetos!
    
    Olá, ${user.full_name}!
    
    Sua conta foi criada com sucesso.
    
    Dados de acesso:
    Email: ${user.email}
    ${temporaryPassword ? `Senha temporária: ${temporaryPassword}` : ''}
    
    Acesse o sistema em: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login
    
    ${temporaryPassword ? 'Importante: Por segurança, altere sua senha no primeiro acesso.' : ''}
  `

  return { html, text }
}

// Função principal para enviar email de boas-vindas (webhook ou email direto)
export const sendWelcomeEmail = async (user: User, temporaryPassword?: string): Promise<boolean> => {
  const useWebhook = process.env.USE_WEBHOOK === 'true'
  
  if (useWebhook) {
    // Enviar via webhook
    const webhookData: WebhookEmailData = {
      user,
      temporaryPassword,
      emailType: 'welcome',
      timestamp: new Date().toISOString(),
    }
    
    return await sendWebhook(webhookData)
  } else {
    // Enviar diretamente via email
    const { html, text } = generateWelcomeEmailTemplate(user, temporaryPassword)
    
    return await sendEmail({
      to: user.email,
      subject: 'Bem-vindo ao Sistema de Gerenciamento de Projetos',
      html,
      text,
    })
  }
}

// Função para enviar email diretamente (mantida para compatibilidade)
export const sendWelcomeEmailDirect = async (user: User, temporaryPassword?: string): Promise<boolean> => {
  const { html, text } = generateWelcomeEmailTemplate(user, temporaryPassword)
  
  return await sendEmail({
    to: user.email,
    subject: 'Bem-vindo ao Sistema de Gerenciamento de Projetos',
    html,
    text,
  })
}
