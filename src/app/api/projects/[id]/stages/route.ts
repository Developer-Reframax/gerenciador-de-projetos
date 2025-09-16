import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '../../../../../lib/supabase-server'
import { cookies } from 'next/headers'

// GET /api/projects/[id]/stages - List all stages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, team_id')
      .eq('id', id)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Projeto não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar projeto:', projectError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Check if user is owner or team member
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      const { data: collaborator, error } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      hasAccess = !!collaborator && !error
    }

    if (!hasAccess) {
       return NextResponse.json(
         { error: 'Acesso negado' },
         { status: 403 }
       )
     }

    // Get stages with their tasks
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select(`
        id,
        name,
        description,
        color,
        position,
        project_id,
        created_at,
        tasks (
          id,
          title,
          description,
          status,
          priority,
          assignee_id,
          position,
          stage_id,
          created_at
        )
      `)
      .eq('project_id', id)
      .order('position', { ascending: true })

    if (stagesError) {
      console.error('Erro ao buscar estágios:', stagesError)
      return NextResponse.json(
        { error: 'Erro ao buscar estágios' },
        { status: 500 }
      )
    }

    // Define types for better type safety
    interface Task {
      id: string
      title: string
      description?: string
      status: string
      priority: string
      assignee_id?: string
      position: number
      stage_id: string
      created_at: string
    }

    interface Stage {
      id: string
      name: string
      description?: string
      color: string
      position: number
      project_id: string
      created_at: string
      tasks?: Task[]
    }

    // Sort tasks by position within each stage
    const stagesWithSortedTasks = (stages as unknown as Stage[]).map((stage) => ({
      ...stage,
      tasks: (stage.tasks || []).sort((a, b) => a.position - b.position)
    }))

    return NextResponse.json({
      stages: stagesWithSortedTasks
    })

  } catch (error) {
    console.error('Erro na API de estágios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/stages - Create a new stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id } = await params

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { name, description, color } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nome do estágio é obrigatório' },
        { status: 400 }
      )
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, team_id')
      .eq('id', id)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Projeto não encontrado' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar projeto:', projectError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Check if user is owner or team member with write access
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      const { data: collaborator, error } = await supabase
        .from('project_collaborators')
        .select('id, role')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      hasAccess = !!collaborator && !error && !!collaborator.role && ['owner', 'manager'].includes(collaborator.role)
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Get the next position
    const { data: lastStage } = await supabase
      .from('stages')
      .select('position')
      .eq('project_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastStage && lastStage.position !== null ? lastStage.position + 1 : 0

    // Create the stage
    const { data: stage, error: stageError } = await supabase
      .from('stages')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        position: nextPosition,
        project_id: id
      })
      .select()
      .single()

    if (stageError) {
      console.error('Erro ao criar estágio:', stageError)
      return NextResponse.json(
        { error: 'Erro ao criar estágio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      stage: {
        ...stage,
        tasks: []
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de criação de estágio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}