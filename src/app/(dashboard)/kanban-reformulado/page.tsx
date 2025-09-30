'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, User, Users, Layers } from 'lucide-react'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { useKanbanData } from '@/hooks/useKanbanData'
import { useKanbanDragDrop } from '@/hooks/useKanbanDragDrop'
import { useEquipes } from '@/hooks/useEquipes'
import { TarefaUnificada, KanbanFilters, Pessoa } from '@/types/kanban'
import { toast } from 'sonner'

interface TaskCardProps {
  tarefa: TarefaUnificada
  isDragging?: boolean
}

function DraggableTask({ tarefa, responsavelId }: { tarefa: TarefaUnificada, responsavelId: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tarefa.id,
    data: {
      tarefa_id: tarefa.id,
      tipo_tarefa: tarefa.tipo,
      responsavel_atual: responsavelId
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <TaskCard tarefa={tarefa} isDragging={isDragging} />
    </div>
  )
}

function TaskCard({ tarefa, isDragging = false }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'concluida':
      case 'concluído':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'em_andamento':
      case 'em andamento':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'pendente':
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const isCompleted = ['concluida', 'concluído', 'completed'].includes(tarefa.status.toLowerCase())

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade.toLowerCase()) {
      case 'alta':
        return 'bg-red-100 text-red-800'
      case 'media':
      case 'média':
        return 'bg-yellow-100 text-yellow-800'
      case 'baixa':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={`mb-3 cursor-move transition-all hover:shadow-md ${
      isDragging ? 'opacity-50 rotate-2' : ''
    }`}>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-medium line-clamp-2 ${isCompleted ? 'line-through' : ''}`}>{tarefa.titulo}</h4>
            <Badge variant="outline" className="text-xs">
              {tarefa.tipo}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">{tarefa.projeto_nome}</p>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Layers className="h-3 w-3" />
            <span>{tarefa.etapa_nome}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${getStatusColor(tarefa.status)}`}>
              {tarefa.status}
            </Badge>
            <Badge className={`text-xs ${getPriorityColor(tarefa.prioridade)}`}>
              {tarefa.prioridade}
            </Badge>
          </div>
          
          {tarefa.prazo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PersonColumnProps {
  pessoa: Pessoa
  tarefas: TarefaUnificada[]
}

function DroppableColumn({ pessoa, tarefas }: PersonColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: pessoa.id
  })

  return (
    <div ref={setNodeRef} className={`min-w-80 max-w-80 ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}>
      <PersonColumn pessoa={pessoa} tarefas={tarefas} />
    </div>
  )
}

function PersonColumn({ pessoa, tarefas }: PersonColumnProps) {
  const tarefasPendentes = tarefas.filter(t => 
    ['pendente', 'em_andamento', 'em andamento', 'todo', 'in_progress'].includes(t.status.toLowerCase())
  )
  const tarefasConcluidas = tarefas.filter(t => 
    ['concluida', 'concluído', 'completed'].includes(t.status.toLowerCase())
  )

  return (
    <div className="min-w-80 max-w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pessoa.avatar_url} alt={pessoa.nome} />
              <AvatarFallback>
                {pessoa.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm truncate">{pessoa.nome}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{pessoa.equipe}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {tarefasPendentes.length} pendentes
            </span>
            <span>•</span>
            <span>{tarefasConcluidas.length} concluídas</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="min-h-96 space-y-1">
            {/* Tarefas Pendentes */}
            {tarefasPendentes.map(tarefa => (
              <DraggableTask
                key={tarefa.id}
                tarefa={tarefa}
                responsavelId={pessoa.id}
              />
            ))}
            
            {/* Tarefas Concluídas */}
            {tarefasConcluidas.map(tarefa => (
              <DraggableTask
                key={tarefa.id}
                tarefa={tarefa}
                responsavelId={pessoa.id}
              />
            ))}
            
            {tarefas.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                Nenhuma tarefa atribuída
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function KanbanReformulado() {
  const [filters, setFilters] = useState<KanbanFilters>({
    tipoVisao: 'pessoa'
  })
  const [draggedTask, setDraggedTask] = useState<TarefaUnificada | null>(null)

  const { equipes } = useEquipes()
  const { pessoas, tarefasPorPessoa, isLoading, error, refetch } = useKanbanData(filters)
  const { handleDragEnd } = useKanbanDragDrop({ onTarefaMoved: refetch })

  const handleDragStart = (event: DragStartEvent) => {
    const tarefaId = event.active.id as string
    // Encontrar a tarefa sendo arrastada
    for (const pessoaTarefas of Object.values(tarefasPorPessoa)) {
      const tarefa = pessoaTarefas.find(t => t.id === tarefaId)
      if (tarefa) {
        setDraggedTask(tarefa)
        break
      }
    }
  }

  const handleDragEndWrapper = (event: DragEndEvent) => {
    setDraggedTask(null)
    handleDragEnd(event)
  }

  if (error) {
    toast.error(`Erro ao carregar dados: ${error.message}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban por Responsável</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie tarefas organizadas por pessoa responsável
          </p>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Seletor de Tipo de Visualização */}
            <div className="flex items-center gap-2">
              <Button
                variant={filters.tipoVisao === 'pessoa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ tipoVisao: 'pessoa' })}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Por Pessoa
              </Button>
              <Button
                variant={filters.tipoVisao === 'equipe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, tipoVisao: 'equipe' })}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Por Equipe
              </Button>
            </div>

            {/* Seletor de Equipe */}
            {filters.tipoVisao === 'equipe' && (
              <Select
                value={filters.equipeId || ''}
                onValueChange={(value) => 
                  setFilters({ ...filters, equipeId: value || undefined })
                }
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipes.map(equipe => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      {equipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="text-sm text-muted-foreground">
              {pessoas.length} {pessoas.length === 1 ? 'pessoa' : 'pessoas'} com tarefas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEndWrapper}>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : pessoas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma pessoa encontrada</h3>
              <p className="text-muted-foreground">
                {filters.tipoVisao === 'equipe' && filters.equipeId
                  ? 'Não há pessoas com tarefas na equipe selecionada.'
                  : 'Não há pessoas com tarefas atribuídas.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pessoas.map(pessoa => (
              <DroppableColumn
                key={pessoa.id}
                pessoa={pessoa}
                tarefas={tarefasPorPessoa[pessoa.id] || []}
              />
            ))}
          </div>
        )}

        <DragOverlay>
          {draggedTask && <TaskCard tarefa={draggedTask} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}