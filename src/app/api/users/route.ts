import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { User } from '@/types/user'

// Função para enviar dados do usuário para webhook
async function sendUserWebhook(user: User, temporaryPassword: string) {
  try {
    // Verificar se webhook está habilitado
    const useWebhook = process.env.USE_WEBHOOK === 'true'
    const webhookUrl = process.env.WEBHOOK_URL
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!useWebhook || !webhookUrl || !webhookSecret) {
      console.log('Webhook não configurado ou desabilitado')
      return
    }

    // Preparar payload no formato especificado
    const webhookPayload = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url || null,
          bio: user.bio || null,
          timezone: user.timezone || "America/Sao_Paulo",
          language: user.language || "pt-BR",
          theme: user.theme || "light",
          notification_preferences: user.notification_preferences || {
            comments: true,
            project_updates: true,
            task_assignments: true,
            push_notifications: true,
            email_notifications: true
          },
          is_active: user.is_active,
          last_seen_at: user.last_seen_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          deleted_at: user.deleted_at,
          role: user.role
        },
        temporaryPassword: temporaryPassword,
        emailType: "welcome",
        timestamp: new Date().toISOString(),
        secret: webhookSecret
      
    }

    // Enviar para webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    })

    if (!response.ok) {
      console.error('Erro ao enviar webhook:', response.status, response.statusText)
    } else {
      console.log('Webhook enviado com sucesso para:', webhookUrl)
    }

  } catch (error) {
    console.error('Erro ao enviar webhook:', error)
    // Não falhar o cadastro se webhook falhar
  }
}

// GET - Listar usuários
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, is_active, created_at, updated_at')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para criar usuários
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || !['admin', 'editor'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem criar usuários' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, full_name, role = 'user' } = body

    // Validações
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email e nome completo são obrigatórios' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const validRoles = ['admin', 'editor', 'membro', 'user']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Função inválida' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    // Criar cliente com Service Role para operações administrativas
    const supabaseAdmin = createServiceRoleClient()

    // Dados para criação do usuário no Auth
    const userData = {
      email,
      password: tempPassword,
      display_name: full_name,
      user_metadata: {
        full_name,
        role
      }
    }

    // Criar usuário no Auth
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser(userData)

    if (createAuthError || !authUser.user) {
      console.error('Erro ao criar usuário no Auth:', createAuthError)
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + (createAuthError?.message || 'Erro desconhecido') },
        { status: 500 }
      )
    }

    // Aguardar trigger executar e buscar usuário criado
    let newUser = null
    let attempts = 0
    const maxAttempts = 5

    while (!newUser && attempts < maxAttempts) {
      attempts++
      
      // Aguardar um pouco para a trigger processar
      await new Promise(resolve => setTimeout(resolve, attempts * 500))

      // Buscar usuário criado pela trigger
      const { data: foundUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single()

      if (foundUser) {
        newUser = foundUser
        break
      }

      if (attempts === maxAttempts) {
        console.warn('Trigger não executou após', maxAttempts, 'tentativas')
        return NextResponse.json({
          success: true,
          user: {
            id: authUser.user.id,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || full_name
          },
          message: 'Usuário criado no sistema de autenticação. A sincronização com a tabela pode levar alguns momentos.',
          warning: 'Trigger ainda processando'
        }, { status: 201 })
      }
    }

    // Enviar dados para webhook se configurado
    if (newUser) {
      await sendUserWebhook(newUser, tempPassword)
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Usuário criado com sucesso! Credenciais enviadas por email.'
    }, { status: 201 })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
