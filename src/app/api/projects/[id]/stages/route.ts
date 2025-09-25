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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user || !user.id) {
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

    // Check if user is owner or team member with write access
    let hasAccess = project.owner_id === user.id

    if (!hasAccess) {
      // Get user's team memberships
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id!)

      if (!teamError && teamMembers && project.team_id) {
        const userTeamIds = teamMembers.map(tm => tm.team_id)
        hasAccess = userTeamIds.includes(project.team_id)
      }
    }

    if (!hasAccess) {
       return NextResponse.json(
         { error: 'Acesso negado' },
         { status: 403 }
       )
     }

    // Get stages with their tasks, risks, and impediments
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
          estimated_hours,
          position,
          stage_id,
          created_at
        )
      `)
      .eq('project_id', id)
      .order('position', { ascending: true })

    // First get all stage IDs for this project
    const stageIds = stages?.map(stage => stage.id) || []

    // Get risks and impediments for all stages in the project
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .in('stage_id', stageIds)

    const { data: impediments, error: impedimentsError } = await supabase
      .from('impediments')
      .select('*')
      .in('stage_id', stageIds)

    if (stagesError) {
      console.error('Erro ao buscar estágios:', stagesError)
      return NextResponse.json(
        { error: 'Erro ao buscar estágios' },
        { status: 500 }
      )
    }

    if (risksError) {
      console.error('Erro ao buscar riscos:', risksError)
    }

    if (impedimentsError) {
      console.error('Erro ao buscar impedimentos:', impedimentsError)
    }

    // Define types for better type safety
    interface Task {
      id: string
      title: string
      description?: string
      status: string
      priority: string
      assignee_id?: string
      estimated_hours?: number
      position: number
      stage_id: string
      created_at: string
    }

    interface Risk {
      id: string
      name: string
      description?: string
      probability: string
      impact: string
      status: string
      stage_id: string
      responsible_id: string
      identification_date: string
      expected_resolution_date?: string
      created_at?: string
      updated_at?: string
    }

    interface Impediment {
      id: string
      description: string
      status: string
      criticality: string
      stage_id: string
      responsible_id: string
      identification_date: string
      expected_resolution_date?: string
      created_at?: string
      updated_at?: string
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
      risks?: Risk[]
      impediments?: Impediment[]
    }

    // Group risks and impediments by stage_id
    const risksByStage = (risks || []).reduce((acc: Record<string, Risk[]>, risk: Risk) => {
      if (risk.stage_id) {
        if (!acc[risk.stage_id]) acc[risk.stage_id] = []
        acc[risk.stage_id].push(risk)
      }
      return acc
    }, {})

    const impedimentsByStage = (impediments || []).reduce((acc: Record<string, Impediment[]>, impediment: Impediment) => {
      if (impediment.stage_id) {
        if (!acc[impediment.stage_id]) acc[impediment.stage_id] = []
        acc[impediment.stage_id].push(impediment)
      }
      return acc
    }, {})

    // Sort tasks by position within each stage and add risks/impediments
    const stagesWithSortedTasks = (stages as unknown as Stage[]).map((stage) => ({
      ...stage,
      order_index: stage.position, // Map position to order_index for frontend compatibility
      tasks: (stage.tasks || []).sort((a, b) => a.position - b.position),
      risks: risksByStage[stage.id] || [],
      impediments: impedimentsByStage[stage.id] || []
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

    if (userError || !user || !user.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    const body = await request.json()
    const { name, description, color, order_index } = body

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
      // Get user's team memberships
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id!)

      if (!teamError && teamMembers && project.team_id) {
        const userTeamIds = teamMembers.map(tm => tm.team_id)
        hasAccess = userTeamIds.includes(project.team_id)
      }
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

    const nextPosition = order_index !== undefined ? order_index : (lastStage && lastStage.position !== null ? lastStage.position + 1 : 0)

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
        order_index: stage.position, // Map position to order_index for frontend compatibility
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