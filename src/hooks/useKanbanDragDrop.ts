import { useCallback } from 'react'
import { DragEndEvent } from '@dnd-kit/core'
import { UseKanbanDragDropReturn } from '@/types/kanban'
import { toast } from 'sonner'

interface UseKanbanDragDropProps {
  onTarefaMoved?: () => void
}

export function useKanbanDragDrop({ onTarefaMoved }: UseKanbanDragDropProps = {}): UseKanbanDragDropReturn {
  const moverTarefa = useCallback(async (
    tarefaId: string, 
    tipoTarefa: 'projeto' | 'workflow', 
    novoResponsavelId: string
  ) => {
    try {
      const response = await fetch('/api/kanban/mover-tarefa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tarefa_id: tarefaId,
          tipo_tarefa: tipoTarefa,
          novo_responsavel_id: novoResponsavelId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao mover tarefa')
      }

      const result = await response.json()
      toast.success('Tarefa movida com sucesso!')
      
      // Callback para atualizar os dados
      if (onTarefaMoved) {
        onTarefaMoved()
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao mover tarefa: ${errorMessage}`)
      throw error
    }
  }, [onTarefaMoved])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    // Extrair dados do elemento arrastado
    const tarefaData = active.data.current
    if (!tarefaData) {
      console.error('Dados da tarefa não encontrados')
      return
    }

    const tarefaId = tarefaData.tarefa_id
    const tipoTarefa = tarefaData.tipo_tarefa
    const responsavelAtual = tarefaData.responsavel_atual
    
    // Extrair ID da pessoa de destino
    const novaPessoaId = over.id as string

    // Verificar se a tarefa está sendo movida para uma pessoa diferente
    if (responsavelAtual === novaPessoaId || !tarefaId || !tipoTarefa) {
      return
    }

    try {
      await moverTarefa(tarefaId, tipoTarefa, novaPessoaId)
    } catch (error) {
      console.error('Erro no drag and drop:', error)
    }
  }, [moverTarefa])

  return {
    handleDragEnd,
    moverTarefa
  }
}