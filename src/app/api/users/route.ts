import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

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
    const { email, full_name, role = 'user', bio, timezone = 'America/Sao_Paulo', language = 'pt-BR' } = body

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

    // Criar usuário no Auth
    const { data: authUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        bio,
        timezone,
        language
      }
    })

    if (createAuthError || !authUser.user) {
      console.error('Erro ao criar usuário no Auth:', createAuthError)
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + (createAuthError?.message || 'Erro desconhecido') },
        { status: 500 }
      )
    }

    // Criar usuário na tabela users
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role,
        bio: bio || null,
        timezone,
        language,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createUserError) {
      console.error('Erro ao criar usuário na tabela:', createUserError)
      
      // Tentar remover o usuário do Auth se falhou na tabela
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
      } catch {
        console.warn('Erro ao limpar usuário do Auth após falha')
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + createUserError.message },
        { status: 500 }
      )
    }

    // TODO: Enviar email com credenciais (implementar serviço de email)
    console.log(`Usuário criado: ${email} - Senha temporária: ${tempPassword}`)

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