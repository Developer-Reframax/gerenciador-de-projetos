import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { updateProjectSchema } from '@/types/project'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET - Buscar projeto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar projeto
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        owner:users!projects_owner_id_fkey(
          id,
          email,
          full_name
        ),
        team:teams(
          id,
          name,
          description
        ),
        requester:users!projects_requester_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
      }
      console.error('Erro ao buscar projeto:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Check if user has access to this project (owner or team member)
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      // Get user's team memberships
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)

      if (teamMembers && teamMembers.length > 0) {
        const userTeamIds = teamMembers.map(tm => tm.team_id)
        // Check if project's team is in user's teams
        hasAccess = !!(project.team_id && userTeamIds.includes(project.team_id))
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Erro na API de busca de projeto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar projeto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validar dados de entrada
    const body = await request.json()
    const validationResult = updateProjectSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Atualizar projeto - payload tipado com Database Update
    const updateData: Database['public']['Tables']['projects']['Update'] = {
      ...validationResult.data,
      updated_at: new Date().toISOString()
    }
    
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('owner_id', user.id)
      .select(`
        *,
        owner:users!projects_owner_id_fkey(id, email, full_name),
        team:teams(id, name, description)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
      }
      console.error('Erro ao atualizar projeto:', error)
      return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Erro na API de atualização de projeto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar projeto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase: SupabaseClient<Database> = createRouteHandlerClient(cookieStore)
    const { id } = await params
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Deletar projeto
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
      }
      console.error('Erro ao atualizar projeto:', error)
      return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Projeto deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de deleção de projeto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}