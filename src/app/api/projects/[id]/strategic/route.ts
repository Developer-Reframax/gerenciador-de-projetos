import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import type { UpdateProjectStrategicForm } from '@/types'

// GET /api/projects/[id]/strategic - Obter informações estratégicas do projeto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const projectId = id

    if (!projectId) {
      return NextResponse.json({
        success: false,
        message: 'ID do projeto é obrigatório'
      }, { status: 400 })
    }

    // Buscar informações estratégicas do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        strategic_objective_id,
        strategic_pillar_id,
        request_date,
        committee_approval_date,
        real_start_date,
        real_end_date,
        start_date,
        due_date,
        budget,
        owner_name,
        direct_responsibles,
        requesting_area,
        planned_budget,
        used_budget,
        lessons_learned,
        total_tasks,
        completed_tasks,
        progress_percentage,
        created_at,
        updated_at,
        strategic_objectives:strategic_objective_id(
          id,
          name,
          description
        ),
        strategic_pillars:strategic_pillar_id(
          id,
          name,
          description
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: 'Projeto não encontrado'
        }, { status: 404 })
      }
      console.error('Erro ao buscar projeto:', projectError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    // Buscar tags do projeto
    const { data: projectTags, error: tagsError } = await supabase
      .from('project_tags')
      .select(`
        tag_id,
        tags:tag_id(
          id,
          name,
          color
        )
      `)
      .eq('project_id', projectId)

    if (tagsError) {
      console.error('Erro ao buscar tags do projeto:', tagsError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    const tags = projectTags?.map(pt => pt.tags).filter(Boolean) || []

    // Buscar áreas do projeto
    const { data: projectAreas, error: areasError } = await supabase
      .from('project_areas')
      .select(`
        area_id,
        areas:area_id(
          id,
          name,
          description
        )
      `)
      .eq('project_id', projectId)

    if (areasError) {
      console.error('Erro ao buscar áreas do projeto:', areasError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    const areas = projectAreas?.map(pa => pa.areas).filter(Boolean) || []

    // Buscar stakeholders do projeto
    const { data: projectStakeholders, error: stakeholdersError } = await supabase
      .from('project_stakeholders')
      .select(`
        user_id,
        users:user_id(
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('project_id', projectId)

    if (stakeholdersError) {
      console.error('Erro ao buscar stakeholders do projeto:', stakeholdersError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    const stakeholders = projectStakeholders?.map(ps => ps.users).filter(Boolean) || []

    // Calcular indicadores informativos
    const totalTasks = (project as { total_tasks?: number }).total_tasks || 0
    const completedTasks = project.completed_tasks || 0
    const pendingTasks = totalTasks - completedTasks
    const progressPercentage = project.progress_percentage || 0

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        project_id: project.id,
        strategic_objective_id: project.strategic_objective_id,
        strategic_pillar_id: project.strategic_pillar_id,
        request_date: project.request_date,
        committee_approval_date: project.committee_approval_date,
        real_start_date: project.real_start_date,
        real_end_date: project.real_end_date,
        start_date: project.start_date,
        due_date: project.due_date,
        budget: project.budget,
        owner_name: project.owner_name,
        direct_responsibles: project.direct_responsibles,
        requesting_area: project.requesting_area,
        planned_budget: project.planned_budget,
        used_budget: project.used_budget,
        lessons_learned: project.lessons_learned,
        strategic_objective: project.strategic_objectives,
        strategic_pillar: project.strategic_pillars,
        tags,
        areas,
        stakeholders,
        // Indicadores informativos (não editáveis)
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        progress_percentage: progressPercentage,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    })
  } catch (error) {
    console.error('Erro ao buscar informações estratégicas do projeto:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// PUT /api/projects/[id]/strategic - Atualizar informações estratégicas do projeto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const projectId = id
    const {
      strategic_objective_id,
      strategic_pillar_id,
      request_date,
      committee_approval_date,
      real_start_date,
      real_end_date,
      start_date,
      due_date,
      budget,
      owner_name,
      direct_responsibles,
      requesting_area,
      planned_budget,
      used_budget,
      tag_ids,
      area_ids,
      stakeholder_ids,
      lessons_learned
    }: UpdateProjectStrategicForm = await request.json()

    if (!projectId) {
      return NextResponse.json({
        success: false,
        message: 'ID do projeto é obrigatório'
      }, { status: 400 })
    }

    // Verificar se o projeto existe
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        message: 'Projeto não encontrado'
      }, { status: 404 })
    }

    // Validações
    if (strategic_objective_id) {
      const { data: objective } = await supabase
        .from('strategic_objectives')
        .select('id')
        .eq('id', strategic_objective_id)
        .single()

      if (!objective) {
        return NextResponse.json({
          success: false,
          message: 'Objetivo estratégico não encontrado'
        }, { status: 400 })
      }
    }

    if (strategic_pillar_id) {
      const { data: pillar } = await supabase
        .from('strategic_pillars')
        .select('id')
        .eq('id', strategic_pillar_id)
        .single()

      if (!pillar) {
        return NextResponse.json({
          success: false,
          message: 'Pilar estratégico não encontrado'
        }, { status: 400 })
      }
    }

    if (real_start_date && real_end_date) {
      const startDate = new Date(real_start_date)
      const endDate = new Date(real_end_date)

      if (startDate >= endDate) {
        return NextResponse.json({
          success: false,
          message: 'Data de início real deve ser anterior à data de fim real'
        }, { status: 400 })
      }
    }

    if (tag_ids && tag_ids.length > 0) {
      const { data: tags } = await supabase
        .from('tags')
        .select('id')
        .in('id', tag_ids)

      if (!tags || tags.length !== tag_ids.length) {
        return NextResponse.json({
          success: false,
          message: 'Uma ou mais tags não foram encontradas'
        }, { status: 400 })
      }
    }

    // Atualizar informações estratégicas do projeto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        strategic_objective_id: strategic_objective_id || null,
        strategic_pillar_id: strategic_pillar_id || null,
        request_date: request_date || null,
        committee_approval_date: committee_approval_date || null,
        real_start_date: real_start_date || null,
        real_end_date: real_end_date || null,
        start_date: start_date || null,
        due_date: due_date || null,
        budget: budget || null,
        owner_name: owner_name || null,
        direct_responsibles: direct_responsibles || null,
        requesting_area: requesting_area || null,
        planned_budget: planned_budget || null,
        used_budget: used_budget || null,
        lessons_learned: lessons_learned || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar projeto:', updateError)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    // Gerenciar tags do projeto
    if (tag_ids !== undefined) {
      // Remover todas as tags existentes
      const { error: deleteTagsError } = await supabase
        .from('project_tags')
        .delete()
        .eq('project_id', projectId)

      if (deleteTagsError) {
        console.error('Erro ao remover tags do projeto:', deleteTagsError)
        return NextResponse.json({ 
          success: false, 
          message: 'Erro interno do servidor' 
        }, { status: 500 })
      }

      // Adicionar novas tags
      if (tag_ids.length > 0) {
        const projectTagsData = tag_ids.map(tagId => ({
          project_id: projectId,
          tag_id: tagId
        }))

        const { error: insertTagsError } = await supabase
          .from('project_tags')
          .insert(projectTagsData)

        if (insertTagsError) {
          console.error('Erro ao adicionar tags ao projeto:', insertTagsError)
          return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
          }, { status: 500 })
        }
      }
    }

    // Gerenciar áreas do projeto
    if (area_ids !== undefined) {
      // Remover todas as áreas existentes
      const { error: deleteAreasError } = await supabase
        .from('project_areas')
        .delete()
        .eq('project_id', projectId)

      if (deleteAreasError) {
        console.error('Erro ao remover áreas do projeto:', deleteAreasError)
        return NextResponse.json({ 
          success: false, 
          message: 'Erro interno do servidor' 
        }, { status: 500 })
      }

      // Adicionar novas áreas
      if (area_ids.length > 0) {
        const projectAreasData = area_ids.map(areaId => ({
          project_id: projectId,
          area_id: areaId
        }))

        const { error: insertAreasError } = await supabase
          .from('project_areas')
          .insert(projectAreasData)

        if (insertAreasError) {
          console.error('Erro ao adicionar áreas ao projeto:', insertAreasError)
          return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
          }, { status: 500 })
        }
      }
    }

    // Gerenciar stakeholders do projeto
    if (stakeholder_ids !== undefined) {
      // Remover todos os stakeholders existentes
      const { error: deleteStakeholdersError } = await supabase
        .from('project_stakeholders')
        .delete()
        .eq('project_id', projectId)

      if (deleteStakeholdersError) {
        console.error('Erro ao remover stakeholders do projeto:', deleteStakeholdersError)
        return NextResponse.json({ 
          success: false, 
          message: 'Erro interno do servidor' 
        }, { status: 500 })
      }

      // Adicionar novos stakeholders
      if (stakeholder_ids.length > 0) {
        // Validar se todos os stakeholder_ids são válidos (não nulos e não vazios)
        const validStakeholderIds = stakeholder_ids.filter(id => id && id.trim() !== '')
        
        if (validStakeholderIds.length === 0) {
          return NextResponse.json({
            success: false,
            message: 'Nenhum stakeholder válido fornecido'
          }, { status: 400 })
        }

        const projectStakeholdersData = validStakeholderIds.map(userId => ({
          project_id: projectId,
          user_id: userId,
          role: 'stakeholder',
          influence_level: 'medium',
          interest_level: 'high'
        }))

        const { error: insertStakeholdersError } = await supabase
          .from('project_stakeholders')
          .insert(projectStakeholdersData)

        if (insertStakeholdersError) {
          console.error('Erro ao adicionar stakeholders ao projeto:', insertStakeholdersError)
          return NextResponse.json({ 
            success: false, 
            message: 'Erro interno do servidor' 
          }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Informações estratégicas atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar informações estratégicas do projeto:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}