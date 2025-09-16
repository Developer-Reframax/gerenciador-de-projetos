import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient, createServiceRoleClient } from '@/lib/supabase-server'
import { CreateUserForm } from '@/types/user'
import { sendWelcomeEmail } from '@/lib/email'
import { generateRandomPassword } from '@/lib/utils'
import { Database } from '@/types/database'



// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
  const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação através dos cookies (sessão)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    let query = supabase
      .from('users')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role && role !== 'all') {
      query = query.eq('role', role as Database['public']['Tables']['users']['Row']['role'])
    }

    if (status && status !== 'all') {
      const isActive = status === 'active'
      query = query.eq('is_active', isActive)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação através dos cookies (sessão)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem permissão para criar usuários (admin ou editor)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || !currentUser.role || !['admin', 'editor'].includes(currentUser.role || '')) {
      return NextResponse.json(
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      )
    }

    const body = await request.json() as CreateUserForm
    const { email, full_name, role, bio, timezone, language } = body

    // Validar dados obrigatórios
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, nome completo e função são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar função
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
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Gerar senha aleatória
    const randomPassword = generateRandomPassword()

    // Criar cliente com service role para operações administrativas
    const serviceRoleSupabase = createServiceRoleClient()

    // Criar usuário no Supabase Auth usando Service Role
    const { data: authUser, error: authCreateError } = await serviceRoleSupabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name,
        role
      }
    })

    if (authCreateError) {
      console.error('Erro ao criar usuário no Auth - detalhes omitidos por segurança')
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + authCreateError.message },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // Aguardar um momento para o trigger criar o registro básico
    await new Promise(resolve => setTimeout(resolve, 100))

    // Atualizar o registro criado pelo trigger com dados completos
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .update({
        full_name,
        role,
        bio: bio || null,
        timezone: timezone || 'America/Sao_Paulo',
        language: language || 'pt-BR',
        is_active: true,
        notification_preferences: {
          comments: true,
          project_updates: true,
          task_assignments: true,
          push_notifications: true,
          email_notifications: true
        },
        updated_at: new Date().toISOString()
      } as Partial<Database['public']['Tables']['users']['Update']>)
      .eq('id', authUser.user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao criar usuário na tabela:', dbError)
      
      // Tentar remover o usuário do Auth se falhou na tabela
      try {
        await serviceRoleSupabase.auth.admin.deleteUser(authUser.user.id)
      } catch {
        console.error('Erro ao limpar usuário do Auth - detalhes omitidos por segurança')
      }
      
      return NextResponse.json(
        { error: 'Erro ao salvar dados do usuário: ' + dbError.message },
        { status: 500 }
      )
    }

    // Enviar credenciais por email
    const emailResult = { success: await sendWelcomeEmail(newUser, randomPassword) }
    
    if (!emailResult.success) {
      console.warn('Falha ao enviar email, mas usuário foi criado')
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Usuário criado com sucesso! Credenciais enviadas por email.',
      emailSent: emailResult.success
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}