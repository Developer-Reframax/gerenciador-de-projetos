import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuração do transporter de email
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Função para enviar webhook
const sendWebhook = async (data: Record<string, unknown>) => {
  if (!process.env.USE_WEBHOOK || process.env.USE_WEBHOOK !== 'true') {
    return { success: true, message: 'Webhook disabled' }
  }

  try {
    const response = await fetch(process.env.WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error('Webhook error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Função para enviar email
const sendEmail = async (notification: Record<string, unknown>, userEmail: string) => {
  try {
    const transporter = createEmailTransporter()
    
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Sistema de Notificações',
        address: process.env.EMAIL_FROM_ADDRESS!,
      },
      to: userEmail,
      subject: `Nova Notificação: ${notification.type}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Nova Notificação</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
              <h3 style="color: #007bff; margin-top: 0;">${notification.type}</h3>
              <p style="color: #666; font-size: 16px; line-height: 1.5;">
                ${notification.message}
              </p>
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                <p style="color: #888; font-size: 14px; margin: 0;">
                  <strong>Prioridade:</strong> ${notification.priority}<br>
                  <strong>Data:</strong> ${new Date(notification.created_at as string).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ver no Sistema
              </a>
            </div>
            
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
              Esta é uma notificação automática do Sistema de Gerenciamento de Projetos.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Função principal para processar notificações pendentes
export async function send_pending_notifications() {
  try {
    console.log('🔄 Iniciando processamento de notificações pendentes...')
    
    // Buscar notificações pendentes de email
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select(`
        *,
        users!inner(email, user_metadata)
      `)
      .eq('status_email', 'pending')
      .order('created_at', { ascending: true })
      .limit(50) // Processar até 50 notificações por vez

    if (fetchError) {
      throw new Error(`Erro ao buscar notificações: ${fetchError.message}`)
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      console.log('✅ Nenhuma notificação pendente encontrada')
      return { success: true, processed: 0, message: 'Nenhuma notificação pendente' }
    }

    console.log(`📧 Encontradas ${pendingNotifications.length} notificações pendentes`)

    const results = {
      processed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      webhooksSent: 0,
      webhooksFailed: 0,
      errors: [] as string[]
    }

    // Processar cada notificação
    for (const notification of pendingNotifications) {
      try {
        const user = notification.users as { email: string; user_metadata?: { full_name?: string } }
        const userEmail = user.email
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'

        // Enviar email
        const emailResult = await sendEmail(notification, userEmail)
        
        // Preparar dados para webhook
        const webhookData = {
          notification_id: notification.id,
          user_id: notification.user_id,
          user_email: userEmail,
          user_name: userName,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          created_at: notification.created_at,
          email_sent: emailResult.success,
          timestamp: new Date().toISOString()
        }

        // Enviar webhook
        const webhookResult = await sendWebhook(webhookData)

        // Atualizar status da notificação
        let newStatus = 'sent'
        if (!emailResult.success && !webhookResult.success) {
          newStatus = 'failed'
        } else if (!emailResult.success) {
          newStatus = 'partial' // Email falhou, mas webhook funcionou
        }

        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            status_email: newStatus,
            sent_at: new Date().toISOString(),
            error_message: !emailResult.success ? emailResult.error : null
          })
          .eq('id', notification.id)

        if (updateError) {
          console.error(`Erro ao atualizar notificação ${notification.id}:`, updateError)
          results.errors.push(`Update failed for ${notification.id}: ${updateError.message}`)
        }

        // Contabilizar resultados
        results.processed++
        if (emailResult.success) results.emailsSent++
        else results.emailsFailed++
        
        if (webhookResult.success) results.webhooksSent++
        else results.webhooksFailed++

        console.log(`✅ Processada notificação ${notification.id} - Email: ${emailResult.success ? 'OK' : 'FALHOU'}, Webhook: ${webhookResult.success ? 'OK' : 'FALHOU'}`)

      } catch (error) {
        console.error(`Erro ao processar notificação ${notification.id}:`, error)
        results.errors.push(`Processing failed for ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        
        // Marcar como falhou
        await supabase
          .from('notifications')
          .update({
            status_email: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', notification.id)
      }
    }

    console.log(`🎉 Processamento concluído:`, results)
    return { success: true, ...results }

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: 0
    }
  }
}

// Rota POST para executar manualmente
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (opcional - pode ser chamado por cron job)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await send_pending_notifications()
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Rota GET para status/health check
export async function GET() {
  try {
    // Verificar quantas notificações pendentes existem
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status_email', 'pending')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      pending_notifications: count || 0,
      webhook_enabled: process.env.USE_WEBHOOK === 'true',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}