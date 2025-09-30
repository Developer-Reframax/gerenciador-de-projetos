import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { PessoasResponse } from '@/types/kanban'

interface TeamMember {
  user_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(await cookies())
    const { searchParams } = new URL(request.url)
    const tipoVisao = searchParams.get('tipo_visao')
    const equipeId = searchParams.get('equipe_id')

    if (!tipoVisao || !['pessoa', 'equipe'].includes(tipoVisao)) {
      return NextResponse.json(
        { error: 'Parâmetro tipo_visao é obrigatório e deve ser "pessoa" ou "equipe"' },
        { status: 400 }
      )
    }

    if (tipoVisao === 'equipe' && !equipeId) {
      return NextResponse.json(
        { error: 'Parâmetro equipe_id é obrigatório quando tipo_visao = "equipe"' },
        { status: 400 }
      )
    }

    // Implementar fallback robusto para consultas
    const executeWithFallback = async <T>(
      primaryQuery: () => Promise<T>, 
      fallbackQuery?: () => Promise<T>
    ): Promise<T> => {
      try {
        return await primaryQuery()
      } catch (error) {
        console.error('Erro na consulta principal:', error)
        if (fallbackQuery) {
          console.log('Tentando consulta de fallback...')
          return await fallbackQuery()
        }
        throw error
      }
    }

    // Se for visualização por equipe, primeiro buscar os IDs dos usuários da equipe
    let teamUserIds: string[] = []
    if (tipoVisao === 'equipe' && equipeId) {
      const result = await executeWithFallback(
        async () => {
          const { data: teamMembersForFilter, error: teamMembersFilterError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', equipeId)

          if (teamMembersFilterError) {
            throw teamMembersFilterError
          }

          return teamMembersForFilter
        }
      )

      if (!result) {
        console.error('Erro ao buscar membros da equipe para filtro')
        return NextResponse.json(
          { error: 'Erro ao buscar membros da equipe' },
          { status: 500 }
        )
      }

      teamUserIds = result?.map((member: TeamMember) => member.user_id) || []
      console.log('IDs dos usuários da equipe selecionada:', teamUserIds)
      
      // Log específico para as equipes mencionadas
      if (equipeId === '16b1b943-814c-4277-a984-1bd8ff842ddd') {
        console.log('DEBUG EQUIPE 16b1b943: Membros encontrados:', teamUserIds.length)
      } else if (equipeId === '839fa439-7003-435e-b315-733904f0d8a4') {
        console.log('DEBUG EQUIPE 839fa439: Membros encontrados:', teamUserIds.length)
      }
    }

    // Buscar tarefas de projetos para identificar usuários únicos
    let projectTasksQuery = supabase
      .from('tasks')
      .select('assignee_id, status')
      .not('assignee_id', 'is', null)

    // Filtrar por usuários da equipe se necessário
    if (tipoVisao === 'equipe' && equipeId && teamUserIds.length > 0) {
      projectTasksQuery = projectTasksQuery.in('assignee_id', teamUserIds)
      console.log('Aplicando filtro de equipe nas tarefas de projetos para:', teamUserIds.length, 'usuários')
    }

    const { data: projectTasks, error: projectTasksError } = await projectTasksQuery

    if (projectTasksError) {
      console.error('Erro ao buscar tarefas de projetos:', projectTasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas de projetos' },
        { status: 500 }
      )
    }

    // Buscar tarefas de workflows para identificar usuários únicos
    let workflowTasksQuery = supabase
      .from('workflow_tasks')
      .select('assigned_to, status')
      .not('assigned_to', 'is', null)

    // Filtrar por usuários da equipe se necessário
    if (tipoVisao === 'equipe' && equipeId && teamUserIds.length > 0) {
      workflowTasksQuery = workflowTasksQuery.in('assigned_to', teamUserIds)
      console.log('Aplicando filtro de equipe nas tarefas de workflows para:', teamUserIds.length, 'usuários')
    }

    const { data: workflowTasks, error: workflowTasksError } = await workflowTasksQuery

    if (workflowTasksError) {
      console.error('Erro ao buscar tarefas de workflows:', workflowTasksError)
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas de workflows' },
        { status: 500 }
      )
    }

    // Combinar todas as tarefas e extrair IDs únicos de usuários
    const allTasks = [...(projectTasks || []), ...(workflowTasks || [])]
    const uniqueUserIds = new Set<string>()
    
    // Coletar todos os IDs únicos de usuários que têm tarefas
    for (const task of allTasks) {
      const userId = 'assignee_id' in task ? task.assignee_id : task.assigned_to
      if (userId) {
        uniqueUserIds.add(userId)
      }
    }

    // Log dos IDs únicos encontrados
    console.log('IDs únicos de usuários com tarefas:', Array.from(uniqueUserIds))
    
    // Log específico para as equipes mencionadas
    if (equipeId === '16b1b943-814c-4277-a984-1bd8ff842ddd') {
      console.log('DEBUG EQUIPE 16b1b943: Usuários com tarefas encontrados:', uniqueUserIds.size)
      console.log('DEBUG EQUIPE 16b1b943: Tarefas de projetos:', projectTasks?.length || 0)
      console.log('DEBUG EQUIPE 16b1b943: Tarefas de workflows:', workflowTasks?.length || 0)
    } else if (equipeId === '839fa439-7003-435e-b315-733904f0d8a4') {
      console.log('DEBUG EQUIPE 839fa439: Usuários com tarefas encontrados:', uniqueUserIds.size)
      console.log('DEBUG EQUIPE 839fa439: Tarefas de projetos:', projectTasks?.length || 0)
      console.log('DEBUG EQUIPE 839fa439: Tarefas de workflows:', workflowTasks?.length || 0)
    }

    // Buscar dados dos usuários que têm tarefas atribuídas
    const { data: usersWithTasks, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .in('id', Array.from(uniqueUserIds))

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    console.log('Usuários encontrados:', usersWithTasks?.map(u => ({ id: u.id, nome: u.full_name })))

    // Buscar informações de equipe separadamente
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select(`
        user_id,
        teams!inner(
          id,
          name
        )
      `)
      .in('user_id', Array.from(uniqueUserIds))

    if (teamMembersError) {
      console.error('Erro ao buscar membros de equipe:', teamMembersError)
    }

    // Criar mapa de equipes por usuário
    const teamMap = new Map()
    for (const member of teamMembers || []) {
      teamMap.set(member.user_id, {
        id: member.teams?.id,
        name: member.teams?.name || 'Sem equipe'
      })
    }

    // Criar mapa de pessoas com suas tarefas
    const pessoasMap = new Map()
    
    if (tipoVisao === 'equipe' && equipeId) {
      // Para visualização por equipe: buscar TODOS os membros da equipe
      // Separar as consultas para evitar problemas com joins complexos e RLS
      
      // 1. Buscar IDs dos membros da equipe
      const { data: teamMemberIds, error: teamMemberIdsError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', equipeId)

      if (teamMemberIdsError) {
        console.error('Erro ao buscar IDs dos membros da equipe:', teamMemberIdsError)
        return NextResponse.json(
          { error: 'Erro ao buscar membros da equipe' },
          { status: 500 }
        )
      }

      console.log('IDs dos membros da equipe encontrados:', teamMemberIds?.length || 0)
      
      // Debug específico para equipes problemáticas
      if (equipeId === '16b1b943-814c-4277-a984-1bd8ff842ddd' || equipeId === '839fa439-7003-435e-b315-733904f0d8a4') {
        console.log(`[DEBUG] Equipe ${equipeId} - IDs encontrados:`, teamMemberIds?.map(m => m.user_id))
      }

      if (!teamMemberIds || teamMemberIds.length === 0) {
        console.log('Nenhum membro encontrado para a equipe:', equipeId)
        return NextResponse.json({ pessoas: [] })
      }

      const userIds = teamMemberIds.map(m => m.user_id)

      // 2. Buscar dados dos usuários separadamente
      const { data: teamUsers, error: teamUsersError } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds)

      if (teamUsersError) {
        console.error('Erro ao buscar dados dos usuários:', teamUsersError)
        return NextResponse.json(
          { error: 'Erro ao buscar dados dos usuários' },
          { status: 500 }
        )
      }

      console.log('Usuários encontrados:', teamUsers?.length || 0)
      
      // Debug específico para equipes problemáticas
      if (equipeId === '16b1b943-814c-4277-a984-1bd8ff842ddd' || equipeId === '839fa439-7003-435e-b315-733904f0d8a4') {
        console.log(`[DEBUG] Equipe ${equipeId} - Usuários encontrados:`, teamUsers?.map(u => ({ id: u.id, name: u.full_name })))
      }

      // 3. Buscar informações da equipe separadamente
      const { data: teamInfo, error: teamInfoError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', equipeId)
        .single()

      if (teamInfoError) {
        console.error('Erro ao buscar informações da equipe:', teamInfoError)
        return NextResponse.json(
          { error: 'Erro ao buscar informações da equipe' },
          { status: 500 }
        )
      }

      // Adicionar todos os membros da equipe ao mapa
      for (const user of teamUsers || []) {
        
        pessoasMap.set(user.id, {
          id: user.id,
          nome: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url,
          equipe: teamInfo.name,
          tarefas_pendentes: 0,
          tarefas_concluidas: 0,
          total_tarefas: 0
        })
      }
    } else {
      // Para visualização geral: apenas usuários com tarefas
      for (const user of usersWithTasks || []) {
        const teamInfo = teamMap.get(user.id)
        const equipe = teamInfo?.name || 'Sem equipe'
        
        pessoasMap.set(user.id, {
          id: user.id,
          nome: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url,
          equipe,
          tarefas_pendentes: 0,
          tarefas_concluidas: 0,
          total_tarefas: 0
        })
      }
    }

    // Função para normalizar status de projetos
    function normalizeProjectStatus(status: string): string {
      const statusLower = status?.toLowerCase() || ''
      switch (statusLower) {
        case 'todo':
          return 'pendente'
        case 'in_progress':
        case 'in progress':
          return 'em_andamento'
        case 'completed':
          return 'concluida'
        case 'cancelled':
        case 'canceled':
          return 'cancelada'
        default:
          return statusLower
      }
    }

    // Logs de debug
    console.log('Debug API pessoas:')
    console.log('- Tarefas de projetos encontradas:', projectTasks?.length || 0)
    console.log('- Tarefas de workflows encontradas:', workflowTasks?.length || 0)
    console.log('- Total de tarefas:', allTasks.length)
    console.log('- Usuários únicos identificados:', uniqueUserIds.size)
    console.log('- Usuários encontrados na base:', usersWithTasks?.length || 0)

    // Contar tarefas por pessoa
    for (const task of allTasks) {
      const taskAssigneeId = 'assignee_id' in task ? task.assignee_id : task.assigned_to
      if (pessoasMap.has(taskAssigneeId)) {
        const pessoa = pessoasMap.get(taskAssigneeId)
        
        // Normalizar status baseado no tipo de tarefa
        let normalizedStatus = task.status?.toLowerCase() || ''
        const isProjectTask = 'assignee_id' in task
        
        if (isProjectTask) {
          // É uma tarefa de projeto, normalizar o status
          normalizedStatus = normalizeProjectStatus(task.status || '')
        }
        
        // Log de debug para normalização
        if (equipeId === '16b1b943-814c-4277-a984-1bd8ff842ddd' || equipeId === '839fa439-7003-435e-b315-733904f0d8a4') {
          console.log(`DEBUG: Tarefa ${isProjectTask ? 'projeto' : 'workflow'} - Status original: "${task.status}" -> Normalizado: "${normalizedStatus}"`)
        }
        
        // Contar tarefas pendentes (incluindo ambos os formatos)
        if (['pendente', 'em_andamento', 'em andamento', 'todo', 'in_progress'].includes(normalizedStatus)) {
          pessoa.tarefas_pendentes++
        } 
        // Contar tarefas concluídas (incluindo ambos os formatos)
        else if (['concluida', 'concluído', 'completed'].includes(normalizedStatus)) {
          pessoa.tarefas_concluidas++
        }
        
        pessoa.total_tarefas = pessoa.tarefas_pendentes + pessoa.tarefas_concluidas
      }
    }

    // Log final das contagens
    console.log('Pessoas processadas:', Array.from(pessoasMap.values()).map(p => ({
      nome: p.nome,
      total: p.total_tarefas,
      pendentes: p.tarefas_pendentes,
      concluidas: p.tarefas_concluidas
    })))

    // Filtrar pessoas baseado no tipo de visualização
    let pessoas = Array.from(pessoasMap.values())
    
    // Para ambas as visualizações: apenas pessoas que têm tarefas
    pessoas = pessoas
      .filter(pessoa => pessoa.total_tarefas > 0)
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const response: PessoasResponse = {
      pessoas: pessoas.map((pessoa) => ({
        id: pessoa.id,
        nome: pessoa.nome,
        email: pessoa.email,
        avatar_url: pessoa.avatar_url,
        equipe: pessoa.equipe,
        total_tarefas: pessoa.total_tarefas,
        tarefas_pendentes: pessoa.tarefas_pendentes,
        tarefas_concluidas: pessoa.tarefas_concluidas
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro na API pessoas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}