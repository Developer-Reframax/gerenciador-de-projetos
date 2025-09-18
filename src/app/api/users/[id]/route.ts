import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { UpdateUserForm } from '@/types/user'
import { Database } from '@/types/database'
import { cookies } from 'next/headers'

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabaseClient = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: userData, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabaseClient = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar dados do usuário atual para verificações de permissão
    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const body = await request.json() as UpdateUserForm
    const { full_name, role, bio, timezone, language, is_active } = body

    // Validar dados obrigatórios - nome completo só é obrigatório se estiver sendo atualizado
    if (full_name !== undefined && !full_name) {
      return NextResponse.json(
        { error: 'Nome completo é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('id, role')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: {
      full_name?: string;
      bio?: string | null;
      timezone?: string;
      language?: string;
      updated_at: string;
      role?: string;
      is_active?: boolean;
    } = {
      updated_at: new Date().toISOString()
    }

    // Adicionar campos apenas se foram fornecidos
    if (full_name !== undefined) {
      updateData.full_name = full_name
    }
    if (bio !== undefined) {
      updateData.bio = bio || null
    }
    if (timezone !== undefined) {
      updateData.timezone = timezone || 'America/Sao_Paulo'
    }
    if (language !== undefined) {
      updateData.language = language || 'pt-BR'
    }

    // Apenas admins podem alterar role
    if (currentUser && currentUser.role === 'admin') {
      if (role) {
        const validRoles = ['admin', 'editor', 'membro', 'user']
        if (!validRoles.includes(role)) {
          return NextResponse.json(
            { error: 'Função inválida' },
            { status: 400 }
          )
        }
        updateData.role = role
      }
    }

    // Qualquer usuário autenticado pode alterar status is_active
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabaseClient
      .from('users')
      .update(updateData as Partial<Database['public']['Tables']['users']['Update']>)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário: ' + updateError.message },
        { status: 500 }
      )
    }

    // Se o role foi alterado, atualizar também no Auth
    if (updateData.role && updateData.role !== existingUser.role) {
      try {
        await supabaseClient.auth.admin.updateUserById(id, {
          user_metadata: {
            ...updatedUser,
            role: updateData.role
          }
        })
      } catch {
        console.warn('Erro ao atualizar metadata no Auth - detalhes omitidos por segurança')
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Usuário atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir usuário (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabaseClient = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário tem permissão para excluir usuários (apenas admin)
    const { data: currentUser } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir usuários' },
        { status: 403 }
      )
    }

    // Não permitir que o usuário exclua a si mesmo
    if (user.id === id) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('id, email, full_name')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - marcar como excluído
    const { error: deleteError } = await supabaseClient
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir usuário:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao excluir usuário: ' + deleteError.message },
        { status: 500 }
      )
    }

    // Desativar usuário no Auth (opcional)
    try {
      await supabaseClient.auth.admin.updateUserById(id, {
        ban_duration: 'none', // Banir indefinidamente
        user_metadata: {
          deleted_at: new Date().toISOString()
        }
      })
    } catch {
      console.warn('Erro ao desativar usuário no Auth - detalhes omitidos por segurança')
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${existingUser.full_name} foi excluído com sucesso`
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}