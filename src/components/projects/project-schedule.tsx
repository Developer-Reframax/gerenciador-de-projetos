'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Edit, Trash2, Clock, User, Flag, CheckSquare, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useProjectMembers } from '@/hooks/use-project-members'

import { apiClient } from '@/lib/api-client'
import { RiskForm } from '@/components/work-items/risk-form'
import { ImpedimentForm } from '@/components/work-items/impediment-form'
import { TaskForm } from '@/components/work-items/task-form'

interface StagesResponse {
  stages: Stage[]
}



interface ProjectMember {
  id: string
  name: string | null
  email: string
  avatar_url?: string | null
  role: string
}

interface Task {
  id: string
  title: string
  description?: string
  priority: 'muito_baixa' | 'baixa' | 'media' | 'alta' | 'muito_alta'
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'completed' | 'cancelled'
  estimated_hours?: number
  assignee_id?: string
  stage_id: string
  order_index: number
  created_at: string
  updated_at: string
}

interface Risk {
  id: string
  name: string
  description?: string
  status: 'identificado' | 'em_analise' | 'em_mitigacao' | 'monitorado' | 'materializado' | 'encerrado'
  probability: 'baixa' | 'media' | 'alta'
  impact: 'prazo' | 'custo' | 'qualidade' | 'reputacao'
  responsible_id: string
  stage_id: string
  identification_date: string
  expected_resolution_date?: string
  created_at?: string
  updated_at?: string
}

interface Impediment {
  id: string
  description: string
  status: 'aberto' | 'em_resolucao' | 'resolvido' | 'cancelado'
  criticality: 'alta' | 'media' | 'baixa'
  responsible_id: string
  stage_id: string
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
  order_index: number
  project_id: string
  tasks?: Task[]
  risks?: Risk[]
  impediments?: Impediment[]
  created_at: string
  updated_at: string
}



interface ProjectScheduleProps {
  projectId: string
}

export function ProjectSchedule({ projectId }: ProjectScheduleProps) {
  const [stages, setStages] = useState<Stage[]>([])
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null)
  const [isAddingRisk, setIsAddingRisk] = useState<string | null>(null)
  const [isAddingImpediment, setIsAddingImpediment] = useState<string | null>(null)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [editingImpediment, setEditingImpediment] = useState<Impediment | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [stageForm, setStageForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'media' as Task['priority'],
    estimated_hours: 1,
    assignee_id: ''
  })
  
  const [riskForm, setRiskForm] = useState({
    name: '',
    description: '',
    status: 'identificado' as Risk['status'],
    probability: 'media' as Risk['probability'],
    impact: 'prazo' as Risk['impact'],
    responsible_id: '',
    identification_date: new Date().toISOString().split('T')[0],
    expected_resolution_date: ''
  })
  
  const [impedimentForm, setImpedimentForm] = useState({
    description: '',
    status: 'aberto' as Impediment['status'],
    criticality: 'media' as Impediment['criticality'],
    responsible_id: '',
    identification_date: new Date().toISOString().split('T')[0],
    expected_resolution_date: ''
  })

  const { members: teamMembers = [] } = useProjectMembers(projectId)

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<StagesResponse>(`/projects/${projectId}/stages`)
      
      // Stages now come with tasks, risks, and impediments included
      const stagesWithItems = response.stages.map((stage: Stage) => ({  ...stage,
        tasks: stage.tasks || [],
        risks: stage.risks || [],
        impediments: stage.impediments || []
      }))
      
      setStages(stagesWithItems.sort((a: Stage, b: Stage) => a.order_index - b.order_index))
    } catch (error) {
      console.error('Error fetching stages:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchStages()
  }, [projectId, fetchStages])

  const handleCreateStage = async () => {
    if (!stageForm.name.trim()) return
    
    try {
      await apiClient.post(`/projects/${projectId}/stages`, {
        ...stageForm,
        order_index: stages.length
      })
      
      setIsAddingStage(false)
      setStageForm({ name: '', description: '', color: '#3B82F6' })
      fetchStages()
    } catch (error) {
      console.error('Error creating stage:', error)
    }
  }

  const handleUpdateStage = async () => {
    if (!editingStage || !stageForm.name.trim()) return
    
    try {
      await apiClient.put(`/projects/${projectId}/stages/${editingStage.id}`, stageForm)
      setEditingStage(null)
      setStageForm({ name: '', description: '', color: '#3B82F6' })
      fetchStages()
    } catch (error) {
      console.error('Error updating stage:', error)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este estágio? Todas as tarefas serão removidas.')) return
    
    try {
      await apiClient.delete(`/projects/${projectId}/stages/${stageId}`)
      fetchStages()
    } catch (error) {
      console.error('Error deleting stage:', error)
    }
  }

  const handleCreateTask = async (stageId: string, taskData?: { title: string; description?: string; priority: 'baixa' | 'media' | 'alta'; estimated_hours: number; assignee_id?: string; stage_id: string }) => {
    const dataToUse = taskData || taskForm
    if (!dataToUse.title?.trim()) return
    
    // Mapeamento de prioridades do português para inglês
    const priorityMapping: Record<string, string> = {
      'baixa': 'low',
      'media': 'medium',
      'alta': 'high'
    }
    
    try {
      const stage = stages.find(s => s.id === stageId)
      const taskCount = stage?.tasks?.length || 0
      
      await apiClient.post(`/projects/${projectId}/stages/${stageId}/tasks`, {
        title: dataToUse.title,
        description: dataToUse.description,
        priority: priorityMapping[dataToUse.priority] || dataToUse.priority,
        estimated_hours: dataToUse.estimated_hours,
        assignee_id: dataToUse.assignee_id === 'none' ? null : dataToUse.assignee_id,
        order_index: taskCount
      })
      
      setIsAddingTask(null)
      setTaskForm({ title: '', description: '', priority: 'media', estimated_hours: 1, assignee_id: '' })
      fetchStages()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) return
    
    // Mapeamento de prioridades do português para inglês
    const priorityMapping: Record<string, string> = {
      'baixa': 'low',
      'media': 'medium',
      'alta': 'high'
    }
    
    try {
      await apiClient.put(`/projects/${projectId}/tasks/${editingTask.id}`, {
        ...taskForm,
        priority: priorityMapping[taskForm.priority] || taskForm.priority,
        assignee_id: taskForm.assignee_id === 'unassigned' ? null : taskForm.assignee_id
      })
      
      setEditingTask(null)
      setTaskForm({ title: '', description: '', priority: 'media', estimated_hours: 1, assignee_id: '' })
      fetchStages()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  // Função para mapear status do inglês (banco) para português (interface)
  const getTaskStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'todo': 'Pendente',
      'in_progress': 'Em Andamento',
      'review': 'Em Revisão',
      'blocked': 'Bloqueada',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    }
    return statusMap[status] || 'Pendente'
  }

  const handleToggleTaskComplete = async (task: Task) => {
    try {
      // Determina o novo status baseado no status atual (usando valores do banco em inglês)
      const newStatus = task.status === 'completed' 
        ? 'todo' // Se está concluída, volta para pendente
        : 'completed' // Se não está concluída, marca como concluída
        
      await apiClient.put(`/projects/${projectId}/tasks/${task.id}`, {
        ...task,
        status: newStatus
      })
      fetchStages()
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    
    try {
      await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`)
      fetchStages()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleUpdateRisk = async () => {
    if (!editingRisk || !riskForm.name.trim()) return
    
    try {
      await apiClient.put(`/projects/${projectId}/risks/${editingRisk.id}`, {
        ...riskForm,
        responsible_id: riskForm.responsible_id === 'unassigned' ? null : riskForm.responsible_id
      })
      
      setEditingRisk(null)
      setRiskForm({
        name: '',
        description: '',
        status: 'identificado',
        probability: 'media',
        impact: 'prazo',
        responsible_id: '',
        identification_date: new Date().toISOString().split('T')[0],
        expected_resolution_date: ''
      })
      fetchStages()
    } catch (error) {
      console.error('Error updating risk:', error)
    }
  }

  const handleDeleteRisk = async (riskId: string) => {
    if (!confirm('Tem certeza que deseja excluir este risco?')) return
    
    try {
      await apiClient.delete(`/projects/${projectId}/risks/${riskId}`)
      fetchStages()
    } catch (error) {
      console.error('Error deleting risk:', error)
    }
  }

  const handleUpdateImpediment = async () => {
    if (!editingImpediment || !impedimentForm.description.trim()) return
    
    try {
      await apiClient.put(`/projects/${projectId}/impediments/${editingImpediment.id}`, {
        ...impedimentForm,
        responsible_id: impedimentForm.responsible_id === 'unassigned' ? null : impedimentForm.responsible_id
      })
      
      setEditingImpediment(null)
      setImpedimentForm({
        description: '',
        status: 'aberto',
        criticality: 'media',
        responsible_id: '',
        identification_date: new Date().toISOString().split('T')[0],
        expected_resolution_date: ''
      })
      fetchStages()
    } catch (error) {
      console.error('Error updating impediment:', error)
    }
  }

  const handleDeleteImpediment = async (impedimentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este impedimento?')) return
    
    try {
      await apiClient.delete(`/projects/${projectId}/impediments/${impedimentId}`)
      fetchStages()
    } catch (error) {
      console.error('Error deleting impediment:', error)
    }
  }

  const toggleStageExpansion = (stageId: string) => {
    const newExpanded = new Set(expandedStages)
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId)
    } else {
      newExpanded.add(stageId)
    }
    setExpandedStages(newExpanded)
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, type } = result

    if (type === 'stage') {
      const newStages = Array.from(stages)
      const [reorderedStage] = newStages.splice(source.index, 1)
      newStages.splice(destination.index, 0, reorderedStage)

      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        order_index: index
      }))

      setStages(updatedStages)

      try {
        // Usar a API de reorder que chama a função RPC update_stage_positions
        const stagePositions = updatedStages.map(stage => ({
          id: stage.id,
          position: stage.order_index
        }))
        
        await apiClient.put(`/projects/${projectId}/stages/reorder`, {
          stages: stagePositions
        })
      } catch (error) {
        console.error('Erro ao atualizar estágio:', error)
        // Reverter para o estado anterior em caso de erro
        fetchStages()
      }
    }

    if (type === 'task') {
      const sourceStageIndex = stages.findIndex(stage => stage.id === source.droppableId)
      const destStageIndex = stages.findIndex(stage => stage.id === destination.droppableId)
      
      if (sourceStageIndex === -1 || destStageIndex === -1) return

      const newStages = [...stages]
      const sourceTasks = [...(newStages[sourceStageIndex].tasks || [])]
      const destTasks = source.droppableId === destination.droppableId 
        ? sourceTasks 
        : [...(newStages[destStageIndex].tasks || [])]

      const [movedTask] = sourceTasks.splice(source.index, 1)
      destTasks.splice(destination.index, 0, {
        ...movedTask,
        stage_id: destination.droppableId
      })

      newStages[sourceStageIndex].tasks = sourceTasks
      newStages[destStageIndex].tasks = destTasks

      setStages(newStages)

      try {
        await apiClient.put(`/projects/${projectId}/tasks/${movedTask.id}`, {
          stage_id: destination.droppableId,
          order_index: destination.index
        })

        const tasksToUpdate = destTasks.map((task, index) => ({
          ...task,
          order_index: index
        }))

        await Promise.all(
          tasksToUpdate.map(task =>
            apiClient.put(`/projects/${projectId}/tasks/${task.id}`, {
              order_index: task.order_index
            })
          )
        )
      } catch (error) {
        console.error('Error moving task:', error)
        fetchStages()
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando itens de trabalho...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Itens de Trabalho</h2>
          <p className="text-gray-600 dark:text-gray-300">Gerencie tarefas, riscos e impedimentos do projeto</p>
        </div>
        <Button onClick={() => setIsAddingStage(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Etapa
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="stages" type="stage" direction="vertical">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="w-full"
                    >
                      <CardHeader
                        className="pb-3 cursor-pointer"
                        style={{ borderLeft: `4px solid ${stage.color}` }}
                        onClick={() => toggleStageExpansion(stage.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <div className="w-2 h-6 bg-gray-300 rounded-sm flex flex-col justify-center gap-0.5">
                                <div className="w-full h-0.5 bg-gray-500 rounded"></div>
                                <div className="w-full h-0.5 bg-gray-500 rounded"></div>
                                <div className="w-full h-0.5 bg-gray-500 rounded"></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ChevronRight 
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  expandedStages.has(stage.id) ? 'rotate-90' : ''
                                }`} 
                              />
                              <div>
                                <CardTitle className="text-lg">{stage.name}</CardTitle>
                                {stage.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{stage.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-auto mr-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" />
                                {(stage.tasks || []).length} tarefas
                              </span>
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {(stage.risks || []).length} riscos
                              </span>
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                {(stage.impediments || []).length} impedimentos
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setIsAddingTask(stage.id)}>
                                  <CheckSquare className="w-4 h-4 mr-2" />
                                  Adicionar Tarefa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddingRisk(stage.id)}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Adicionar Risco
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddingImpediment(stage.id)}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Adicionar Impedimento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingStage(stage)
                                setStageForm({
                                  name: stage.name,
                                  description: stage.description || '',
                                  color: stage.color
                                })
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStage(stage.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {expandedStages.has(stage.id) && (
                        <CardContent className="space-y-4">
                        {/* Tasks Section */}
                        {(stage.tasks || []).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" />
                              Tarefas
                            </h4>
                            <div className="space-y-2">
                              {(stage.tasks || []).map((task) => (
                                <div key={task.id} className={`p-3 border rounded-lg ${
                                  task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-medium ${
                                          task.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                        }`}>
                                          {task.title}
                                        </h4>
                                        <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                          <Flag className="w-3 h-3 mr-1" />
                                          {getPriorityText(task.priority)}
                                        </Badge>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            task.status === 'completed' 
                                              ? 'bg-green-100 text-green-800 border-green-300 font-semibold' 
                                              : ''
                                          }`}
                                        >
                                          {getTaskStatusText(task.status)}
                                        </Badge>
                                      </div>
                                      {task.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        {task.estimated_hours && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {task.estimated_hours}h estimadas
                                          </div>
                                        )}
                                        {task.assignee_id && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {teamMembers.find((m: ProjectMember) => m.id === task.assignee_id)?.name || 'Responsável'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggleTaskComplete(task)}
                                        className={`${
                                          task.status === 'completed' 
                                            ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                            : 'hover:bg-gray-100'
                                        }`}
                                        title={task.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluída'}
                                      >
                                        <CheckSquare className={`w-3 h-3 ${
                                          task.status === 'completed' ? 'fill-green-600' : ''
                                        }`} />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingTask(task)
                                          setTaskForm({
                                            title: task.title,
                                            description: task.description || '',
                                            priority: task.priority,
                                            estimated_hours: task.estimated_hours || 1,
                                            assignee_id: task.assignee_id || 'unassigned'
                                          })
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTask(task.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risks Section */}
                        {(stage.risks || []).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Riscos
                            </h4>
                            <div className="space-y-2">
                              {(stage.risks || []).map((risk) => (
                                <div key={risk.id} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                                  <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{risk.name}</h4>
                                        <Badge className={getProbabilityColor(risk.probability)} variant="secondary">
                                          <Flag className="w-3 h-3 mr-1" />
                                          {getProbabilityText(risk.probability)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {getRiskStatusText(risk.status)}
                                        </Badge>
                                      </div>
                                      {risk.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{risk.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span>Probabilidade: {getProbabilityText(risk.probability)}</span>
                                        <span>Impacto: {getImpactText(risk.impact)}</span>
                                        {risk.responsible_id && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {teamMembers.find((m: ProjectMember) => m.id === risk.responsible_id)?.name || 'Responsável'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingRisk(risk)
                                          setRiskForm({
                                            name: risk.name,
                                            description: risk.description || '',
                                            status: risk.status,
                                            probability: risk.probability,
                                            impact: risk.impact,
                                            responsible_id: risk.responsible_id || 'unassigned',
                                            identification_date: risk.identification_date || new Date().toISOString().split('T')[0],
                                            expected_resolution_date: risk.expected_resolution_date || ''
                                          })
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteRisk(risk.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Impediments Section */}
                        {(stage.impediments || []).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              Impedimentos
                            </h4>
                            <div className="space-y-2">
                              {(stage.impediments || []).map((impediment) => (
                                <div key={impediment.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                  <div className="flex items-center gap-3">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{impediment.description}</h4>
                                        <Badge className={getCriticalityColor(impediment.criticality)} variant="secondary">
                                          <Flag className="w-3 h-3 mr-1" />
                                          {getCriticalityText(impediment.criticality)}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {getImpedimentStatusText(impediment.status)}
                                        </Badge>
                                      </div>
                                      {impediment.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{impediment.description}</p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span>Criticidade: {getCriticalityText(impediment.criticality)}</span>
                                        {impediment.responsible_id && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {teamMembers.find((m: ProjectMember) => m.id === impediment.responsible_id)?.name || 'Responsável'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingImpediment(impediment)
                                          setImpedimentForm({
                                            description: impediment.description,
                                            status: impediment.status,
                                            criticality: impediment.criticality,
                                            responsible_id: impediment.responsible_id || 'unassigned',
                                            identification_date: impediment.identification_date || new Date().toISOString().split('T')[0],
                                            expected_resolution_date: impediment.expected_resolution_date || ''
                                          })
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteImpediment(impediment.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Add Task Modal */}
                        <Dialog open={isAddingTask === stage.id} onOpenChange={(open) => {
                          if (!open) {
                            setIsAddingTask(null)
                            setTaskForm({ title: '', description: '', priority: 'media', estimated_hours: 1, assignee_id: '' })
                          }
                        }}>
                          <DialogContent className="sm:max-w-[425px]">
                             <DialogHeader>
                               <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                               <DialogDescription>
                                 Preencha os dados da nova tarefa para a etapa &quot;{stage.name}&quot;.
                               </DialogDescription>
                             </DialogHeader>
                            <TaskForm
                              stages={stages}
                              onSubmit={(data) => handleCreateTask(stage.id, data)}
                              onCancel={() => {
                                setIsAddingTask(null)
                                setTaskForm({ title: '', description: '', priority: 'media', estimated_hours: 1, assignee_id: '' })
                              }}
                              defaultStageId={stage.id}
                            />
                          </DialogContent>
                        </Dialog>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {stages.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum estágio criado</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Comece criando o primeiro estágio do seu projeto.</p>
          <Button onClick={() => setIsAddingStage(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Estágio
          </Button>
        </div>
      )}

      {/* Add Stage Dialog */}
      <Dialog open={isAddingStage} onOpenChange={setIsAddingStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Estágio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Nome do Estágio</label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Ex: Planejamento, Desenvolvimento, Testes"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Descrição (opcional)</label>
              <Textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder="Descreva o que acontece neste estágio"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Cor</label>
              <Input
                type="color"
                value={stageForm.color}
                onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                className="w-20 h-10"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateStage} disabled={!stageForm.name.trim()}>
                Criar Estágio
              </Button>
              <Button variant="outline" onClick={() => setIsAddingStage(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estágio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Estágio</label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Ex: Planejamento, Desenvolvimento, Testes"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder="Descreva o que acontece neste estágio"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <Input
                type="color"
                value={stageForm.color}
                onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                className="w-20 h-10"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateStage} disabled={!stageForm.name.trim()}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditingStage(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Título</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Nome da tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Descrição</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Descrição da tarefa"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Prioridade</label>
              <Select
                value={taskForm.priority}
                onValueChange={(value: Task['priority']) => 
                  setTaskForm({ ...taskForm, priority: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Duração (horas)</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={taskForm.estimated_hours}
                  onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: parseFloat(e.target.value) || 1 })}
                  placeholder="Horas"
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Responsável</label>
              <Select
                value={taskForm.assignee_id}
                onValueChange={(value) => setTaskForm({ ...taskForm, assignee_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {teamMembers.map((member: ProjectMember) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateTask} disabled={!taskForm.title.trim()}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Risk Dialog */}
      <Dialog open={!!editingRisk} onOpenChange={() => setEditingRisk(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Nome do Risco</label>
              <Input
                value={riskForm.name}
                onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                placeholder="Nome do risco"
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Descrição</label>
              <Textarea
                value={riskForm.description}
                onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                placeholder="Descrição do risco"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Probabilidade</label>
              <Select
                value={riskForm.probability}
                onValueChange={(value) => setRiskForm({ ...riskForm, probability: value as 'alta' | 'media' | 'baixa' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Impacto</label>
              <Select
                value={riskForm.impact}
                onValueChange={(value) => setRiskForm({ ...riskForm, impact: value as 'prazo' | 'custo' | 'qualidade' | 'reputacao' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prazo">Prazo</SelectItem>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="qualidade">Qualidade</SelectItem>
                  <SelectItem value="reputacao">Reputação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Status</label>
              <Select
                value={riskForm.status}
                onValueChange={(value) => setRiskForm({ ...riskForm, status: value as 'identificado' | 'em_analise' | 'em_mitigacao' | 'monitorado' | 'materializado' | 'encerrado' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificado">Identificado</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_mitigacao">Em Mitigação</SelectItem>
                  <SelectItem value="monitorado">Monitorado</SelectItem>
                  <SelectItem value="materializado">Materializado</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Responsável</label>
              <Select
                value={riskForm.responsible_id}
                onValueChange={(value) => setRiskForm({ ...riskForm, responsible_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {teamMembers.map((member: ProjectMember) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateRisk} disabled={!riskForm.name.trim()}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditingRisk(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Impediment Dialog */}
      <Dialog open={!!editingImpediment} onOpenChange={() => setEditingImpediment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Impedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Descrição do Impedimento</label>
              <Textarea
                value={impedimentForm.description}
                onChange={(e) => setImpedimentForm({ ...impedimentForm, description: e.target.value })}
                placeholder="Descrição do impedimento"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Criticidade</label>
              <Select
                value={impedimentForm.criticality}
                onValueChange={(value) => setImpedimentForm({ ...impedimentForm, criticality: value as 'alta' | 'media' | 'baixa' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Status</label>
              <Select
                value={impedimentForm.status}
                onValueChange={(value) => setImpedimentForm({ ...impedimentForm, status: value as 'aberto' | 'em_resolucao' | 'resolvido' | 'cancelado' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_resolucao">Em Resolução</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Responsável</label>
              <Select
                value={impedimentForm.responsible_id}
                onValueChange={(value) => setImpedimentForm({ ...impedimentForm, responsible_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sem responsável</SelectItem>
                  {teamMembers.map((member: ProjectMember) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateImpediment} disabled={!impedimentForm.description.trim()}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setEditingImpediment(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar risco */}
      {isAddingRisk && (
        <Dialog open={!!isAddingRisk} onOpenChange={() => setIsAddingRisk(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Risco</DialogTitle>
            </DialogHeader>
            <RiskForm
              stages={stages}
              onSubmit={async (data) => {
                 await apiClient.post(`/projects/${projectId}/risks`, data as unknown as Record<string, unknown>)
                  setIsAddingRisk(null)
                  fetchStages()
                }}
              onCancel={() => setIsAddingRisk(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para adicionar impedimento */}
      {isAddingImpediment && (
        <Dialog open={!!isAddingImpediment} onOpenChange={() => setIsAddingImpediment(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Impedimento</DialogTitle>
            </DialogHeader>
            <ImpedimentForm
              stages={stages}
              onSubmit={async (data) => {
                 await apiClient.post(`/projects/${projectId}/impediments`, data as unknown as Record<string, unknown>)
                  setIsAddingImpediment(null)
                  fetchStages()
                }}
              onCancel={() => setIsAddingImpediment(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Helper functions for text formatting
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgente': return 'bg-red-100 text-red-800'
    case 'alta': return 'bg-orange-100 text-orange-800'
    case 'media': return 'bg-yellow-100 text-yellow-800'
    case 'baixa': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgente': return 'Urgente'
    case 'alta': return 'Alta'
    case 'media': return 'Média'
    case 'baixa': return 'Baixa'
    default: return priority
  }
}

function getRiskStatusText(status: string): string {
  switch (status) {
    case 'identificado': return 'Identificado'
    case 'avaliado': return 'Avaliado'
    case 'mitigando': return 'Mitigando'
    case 'monitorando': return 'Monitorando'
    case 'fechado': return 'Fechado'
    default: return status
  }
}

function getImpedimentStatusText(status: string): string {
  switch (status) {
    case 'identificado': return 'Identificado'
    case 'em_progresso': return 'Em Progresso'
    case 'resolvido': return 'Resolvido'
    case 'fechado': return 'Fechado'
    default: return status
  }
}

function getProbabilityText(probability: string): string {
  switch (probability) {
    case 'muito_baixa': return 'Muito Baixa'
    case 'baixa': return 'Baixa'
    case 'media': return 'Média'
    case 'alta': return 'Alta'
    case 'muito_alta': return 'Muito Alta'
    default: return probability
  }
}

function getProbabilityColor(probability: string): string {
  switch (probability) {
    case 'muito_baixa': return 'bg-green-100 text-green-800'
    case 'baixa': return 'bg-yellow-100 text-yellow-800'
    case 'media': return 'bg-orange-100 text-orange-800'
    case 'alta': return 'bg-red-100 text-red-800'
    case 'muito_alta': return 'bg-red-200 text-red-900'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getCriticalityText(criticality: string): string {
  switch (criticality) {
    case 'baixa': return 'Baixa'
    case 'media': return 'Média'
    case 'alta': return 'Alta'
    case 'critica': return 'Crítica'
    default: return criticality
  }
}

function getCriticalityColor(criticality: string): string {
  switch (criticality) {
    case 'baixa': return 'bg-green-100 text-green-800'
    case 'media': return 'bg-yellow-100 text-yellow-800'
    case 'alta': return 'bg-orange-100 text-orange-800'
    case 'critica': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getImpactText(impact: string): string {
  switch (impact) {
    case 'muito_baixo': return 'Muito Baixo'
    case 'baixo': return 'Baixo'
    case 'medio': return 'Médio'
    case 'alto': return 'Alto'
    case 'muito_alto': return 'Muito Alto'
    default: return impact
  }
}

