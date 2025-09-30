import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { TarefasPorPessoaResponse } from '@/types/kanban'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(await cookies())
    const { searchParams } = new URL(request.url)
    const pessoaIdsParam = searchParams.get('pessoa_ids')

    if (!pessoaIdsParam) {
      return NextResponse.json(
        { error: 'Parâmetro pessoa_ids é obrigatório' },
        { status: 400 }
      )
    }

    // Parse dos IDs das pessoas (formato: id1,id2,id3)
    const pessoaIds = pessoaIdsParam.split(',').filter(id => id.trim())

    if (pessoaIds.length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um ID de pessoa deve ser fornecido' },
        { status: 400 }
      )
    }

    // Buscar tarefas de projetos
    const { data: tarefasProjetos, error: errorProjetos } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        created_at,
        project:projects(name),
        stage:stages(name)
      `)
      .in('assignee_id', pessoaIds)

    if (errorProjetos) {
      console.error('Erro ao buscar tarefas de projetos:', errorProjetos)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar tarefas de workflows
    const { data: tarefasWorkflows, error: errorWorkflows } = await supabase
      .from('workflow_tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assigned_to,
        created_at,
        workflow:workflows(name),
        workflow_stage:workflow_stages(name)
      `)
      .in('assigned_to', pessoaIds)

    if (errorWorkflows) {
      console.error('Erro ao buscar tarefas de workflows:', errorWorkflows)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Função para normalizar status das tarefas de projeto
    const normalizeProjectStatus = (status: string): string => {
      switch (status.toLowerCase()) {
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
          return status
      }
    }

    // Unificar tarefas
    const tarefasUnificadas = [
      ...(tarefasProjetos || []).map((tarefa: {
        id: string;
        title: string;
        status: string;
        priority?: string | null;
        due_date?: string | null;
        assignee_id: string | null;
        created_at: string;
        project?: { name: string } | null;
        stage?: { name: string } | null;
      }): {
        id: string;
        titulo: string;
        tipo: 'projeto' | 'workflow';
        projeto_nome: string;
        etapa_nome: string;
        status: string;
        prioridade: string;
        prazo?: string;
        assigned_to: string;
        criado_em: string;
      } => ({
        id: tarefa.id,
        titulo: tarefa.title,
        tipo: 'projeto' as const,
        projeto_nome: tarefa.project?.name || 'Projeto sem nome',
        etapa_nome: tarefa.stage?.name || 'Sem etapa',
        status: normalizeProjectStatus(tarefa.status),
        prioridade: (tarefa.priority as 'baixa' | 'media' | 'alta') || 'media',
        prazo: tarefa.due_date || undefined,
        assigned_to: tarefa.assignee_id || '',
        criado_em: tarefa.created_at
      })),
      ...(tarefasWorkflows || []).map((tarefa: {
        id: string;
        title: string;
        status: string | null;
        priority?: string | null;
        due_date?: string | null;
        assigned_to: string | null;
        created_at: string | null;
        workflow?: { name: string } | null;
        workflow_stage?: { name: string } | null;
      }): {
        id: string;
        titulo: string;
        tipo: 'projeto' | 'workflow';
        projeto_nome: string;
        etapa_nome: string;
        status: string;
        prioridade: string;
        prazo?: string;
        assigned_to: string;
        criado_em: string;
      } => ({
        id: tarefa.id,
        titulo: tarefa.title,
        tipo: 'workflow' as const,
        projeto_nome: tarefa.workflow?.name || 'Workflow sem nome',
        etapa_nome: tarefa.workflow_stage?.name || 'Sem etapa',
        status: tarefa.status || 'todo',
        prioridade: (tarefa.priority as 'baixa' | 'media' | 'alta') || 'media',
        prazo: tarefa.due_date || undefined,
        assigned_to: tarefa.assigned_to || '',
        criado_em: tarefa.created_at || new Date().toISOString()
      }))
    ]

    // Ordenar tarefas: pendentes primeiro, depois por data de criação
    const tarefas = tarefasUnificadas.sort((a, b) => {
      // Primeiro por pessoa
      if (a.assigned_to !== b.assigned_to) {
        return a.assigned_to.localeCompare(b.assigned_to)
      }
      // Depois por status (pendentes primeiro)
      const statusOrder = { 'pendente': 0, 'em_andamento': 0, 'concluida': 1, 'cancelada': 1 }
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 1
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 1
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      // Por último por data de criação (mais recente primeiro)
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    })

    // Agrupar tarefas por pessoa
    const tarefasPorPessoa: Record<string, {
      id: string;
      titulo: string;
      tipo: 'projeto' | 'workflow';
      projeto_nome: string;
      etapa_nome: string;
      status: string;
      prioridade: 'baixa' | 'media' | 'alta';
      prazo?: string;
      assigned_to: string;
      criado_em: string;
    }[]> = {}
    
    // Inicializar com arrays vazios para todas as pessoas solicitadas
    pessoaIds.forEach(pessoaId => {
      tarefasPorPessoa[pessoaId] = []
    })

    // Agrupar tarefas por assigned_to
    tarefas.forEach((tarefa: {
      id: string;
      titulo: string;
      tipo: 'projeto' | 'workflow';
      projeto_nome: string;
      etapa_nome: string;
      status: string;
      prioridade: string;
      prazo?: string;
      assigned_to: string;
      criado_em: string;
    }) => {
      if (tarefa.assigned_to && tarefasPorPessoa[tarefa.assigned_to]) {
        tarefasPorPessoa[tarefa.assigned_to].push({
          id: tarefa.id,
          titulo: tarefa.titulo,
          tipo: tarefa.tipo,
          projeto_nome: tarefa.projeto_nome,
          etapa_nome: tarefa.etapa_nome,
          status: tarefa.status,
          prioridade: (tarefa.prioridade as 'baixa' | 'media' | 'alta') || 'media',
          prazo: tarefa.prazo,
          assigned_to: tarefa.assigned_to,
          criado_em: tarefa.criado_em
        })
      }
    })

    const response: TarefasPorPessoaResponse = {
      tarefas_por_pessoa: tarefasPorPessoa
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro na API tarefas-por-pessoa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}