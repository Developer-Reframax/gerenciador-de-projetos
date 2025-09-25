import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Interfaces para tipagem
interface UpdateProfileData {
  full_name?: string
  bio?: string | null
  avatar_url?: string | null
  timezone?: string
  language?: string
  updated_at: string
}

interface UserMetadata {
  full_name?: string
  bio?: string
  timezone?: string
  language?: string
}

// GET - Obter perfil do usuário
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient(await cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar dados do usuário
    const { data: userData, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, bio, timezone, language, role, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar perfil:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile: userData })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient(await cookieStore)

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, bio, avatar_url, timezone, language } = body

    // Validações
    if (full_name && full_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio deve ter no máximo 500 caracteres' },
        { status: 400 }
      )
    }

    const validLanguages = ['pt-BR', 'en-US', 'es-ES']
    if (language && !validLanguages.includes(language)) {
      return NextResponse.json(
        { error: 'Idioma inválido' },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: UpdateProfileData = {
      updated_at: new Date().toISOString()
    }

    if (full_name !== undefined) updateData.full_name = full_name.trim()
    if (bio !== undefined) updateData.bio = bio || null
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null
    if (timezone !== undefined) updateData.timezone = timezone
    if (language !== undefined) updateData.language = language

    // Atualizar dados na tabela users
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    // Atualizar metadados do usuário no Auth se necessário
    if (full_name || bio || timezone || language) {
      const userMetadata: UserMetadata = {}
      if (full_name) userMetadata.full_name = full_name.trim()
      if (bio !== undefined) userMetadata.bio = bio
      if (timezone) userMetadata.timezone = timezone
      if (language) userMetadata.language = language

      await supabase.auth.updateUser({
        data: userMetadata
      })
    }

    return NextResponse.json({
      success: true,
      profile: updatedUser,
      message: 'Perfil atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}