'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Trash2, 
  GripVertical,
  User,
  Flag,
  Clock
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useTeamMembers } from '@/hooks/use-team-members'
import { useProject } from '@/hooks/use-project'
import { apiClient } from '@/lib/api-client'

// Interfaces para respostas da API
interface StagesResponse {
  stages: Stage[]
}

interface TasksResponse {
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
  estimated_hours?: number
  position: number
  stage_id: string
}

interface Stage {
  id: string
  name: string
  description?: string
  color: string
  position: number
  project_id: string
  tasks: Task[]
}

interface ProjectScheduleProps {
  projectId: string
}

export function ProjectSchedule({ projectId }: ProjectScheduleProps) {
  const [stages, setStages] = useState<Stage[]>([])
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Form states
  const [stageForm, setStageForm] = useState({ name: '', description: '', color: '#3b82f6' })
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimated_hours: 1,
    assignee_id: ''
  })

  // Get project data
  const { project } = useProject(projectId)
  
  // Get team members for the project
  const { members: teamMembers = [] } = useTeamMembers(project?.team_id || '')

  // Fetch stages and tasks
  const fetchStages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiClient.get<StagesResponse>(`/api/projects/${projectId}/stages`)
      setStages(data.stages || [])
      
      // Expand all stages by default
      const stageIds = new Set<string>(data.stages?.map((stage: Stage) => stage.id) || [])
      setExpandedStages(stageIds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchStages()
  }, [fetchStages])

  // Toggle stage expansion
  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages)
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId)
    } else {
      newExpanded.add(stageId)
    }
    setExpandedStages(newExpanded)
  }

  // Create stage
  const handleCreateStage = async () => {
    try {
      await apiClient.post(`/api/projects/${projectId}/stages`, stageForm)
      
      await fetchStages()
      setIsAddingStage(false)
      setStageForm({ name: '', description: '', color: '#3b82f6' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar estágio')
    }
  }

  // Update stage
  const handleUpdateStage = async () => {
    if (!editingStage) return
    
    try {
      await apiClient.put(`/api/projects/${projectId}/stages/${editingStage.id}`, stageForm)
      
      await fetchStages()
      setEditingStage(null)
      setStageForm({ name: '', description: '', color: '#3b82f6' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar estágio')
    }
  }

  // Delete stage
  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Tem certeza que deseja excluir este estágio? Todas as tarefas serão removidas.')) {
      return
    }
    
    try {
      await apiClient.delete(`/api/projects/${projectId}/stages/${stageId}`)
      
      await fetchStages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir estágio')
    }
  }

  // Create task
  const handleCreateTask = async (stageId: string) => {
    try {
      const taskData = {
        ...taskForm,
        assignee_id: taskForm.assignee_id === 'none' ? null : taskForm.assignee_id
      }
      
      await apiClient.post(`/api/projects/${projectId}/stages/${stageId}/tasks`, taskData)
      
      await fetchStages()
      setIsAddingTask(null)
      setTaskForm({ title: '', description: '', priority: 'medium', estimated_hours: 1, assignee_id: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa')
    }
  }

  // Update task
  const handleUpdateTask = async () => {
    if (!editingTask) return
    
    try {
      const taskData = {
        ...taskForm,
        assignee_id: taskForm.assignee_id === 'none' ? null : taskForm.assignee_id
      }
      
      await apiClient.put(`/api/projects/${projectId}/tasks/${editingTask.id}`, taskData)
      
      await fetchStages()
      setEditingTask(null)
      setTaskForm({ title: '', description: '', priority: 'medium', estimated_hours: 1, assignee_id: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa')
    }
  }

  // Toggle task completion
  const handleToggleTaskCompletion = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        // Para desmarcar como concluída, usar a rota PUT geral
        await apiClient.put(`/api/projects/${projectId}/tasks/${task.id}`, { status: 'todo' })
      } else {
        // Para marcar como concluída, usar a rota específica PATCH
        await apiClient.patch(`/api/projects/${projectId}/tasks/${task.id}/complete`)
      }
      
      await fetchStages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa')
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return
    }
    
    try {
      await apiClient.delete(`/api/projects/${projectId}/tasks/${taskId}`)
      
      await fetchStages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tarefa')
    }
  }

  // Handle drag and drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId, type } = result
    
    // Handle stage reordering
    if (type === 'STAGE') {
      const reorderedStages = Array.from(stages)
      const [reorderedStage] = reorderedStages.splice(source.index, 1)
      reorderedStages.splice(destination.index, 0, reorderedStage)

      // Update positions
      const updatedStages = reorderedStages.map((stage, index) => ({
        ...stage,
        position: index
      }))

      // Optimistically update UI
      setStages(updatedStages)

      // Send to server
      try {
        const stageUpdates = updatedStages.map(stage => ({
          id: stage.id,
          position: stage.position
        }))

        await apiClient.put(`/api/projects/${projectId}/stages/reorder`, { stages: stageUpdates })
      } catch {
        // Revert on error
        await fetchStages()
        setError('Erro ao reordenar estágios')
      }
      return
    }
    
    // Handle task reordering within the same stage
    if (source.droppableId !== destination.droppableId) return
    
    const stageId = source.droppableId
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    const tasks = Array.from(stage.tasks)
    const [reorderedTask] = tasks.splice(source.index, 1)
    tasks.splice(destination.index, 0, reorderedTask)

    // Update positions
    const updatedTasks = tasks.map((task, index) => ({
      ...task,
      position: index
    }))

    // Optimistically update UI
    const updatedStages = stages.map(s => 
      s.id === stageId ? { ...s, tasks: updatedTasks } : s
    )
    setStages(updatedStages)

    // Send to server
    try {
      const result = await apiClient.put<TasksResponse>(`/api/projects/${projectId}/tasks/${draggableId}/reorder`, {
        position: destination.index,
        stage_id: stageId 
      })
      
      // Update the stage with the returned tasks from the server
      if (result.tasks) {
        const updatedStagesFromServer = stages.map(s => 
          s.id === stageId ? { ...s, tasks: result.tasks } : s
        )
        setStages(updatedStagesFromServer)
      }
    } catch (error) {
      console.error('Erro ao reordenar tarefa:', error)
      // Revert on error
      await fetchStages()
      setError('Erro ao reordenar tarefa')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Média'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cronograma do Projeto</h2>
        <Button onClick={() => setIsAddingStage(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Estágio
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stages */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stages" type="STAGE">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided, snapshot) => (
                    <Card 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`overflow-hidden transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      }`}
                    >
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{ borderLeft: `4px solid ${stage.color}` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </div>
                            <div 
                              className="flex items-center gap-3 flex-1" 
                              onClick={() => toggleStage(stage.id)}
                            >
                              {expandedStages.has(stage.id) ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                              )}
                              <div>
                                <CardTitle className="text-lg">{stage.name}</CardTitle>
                                {stage.description && (
                                  <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                                )}
                              </div>
                              <Badge variant="outline">
                                {stage.tasks.length} tarefa{stage.tasks.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsAddingTask(stage.id)
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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
                              variant="ghost"
                              size="sm"
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
                <CardContent className="pt-0">
                  <Droppable droppableId={stage.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2"
                      >
                        {stage.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                  
                                  <Checkbox
                                    checked={task.status === 'completed'}
                                    onCheckedChange={() => handleToggleTaskCompletion(task)}
                                  />
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={`font-medium ${
                                        task.status === 'completed' 
                                          ? 'line-through text-gray-500' 
                                          : 'text-gray-900'
                                      }`}>
                                        {task.title}
                                      </h4>
                                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                        <Flag className="w-3 h-3 mr-1" />
                                        {getPriorityText(task.priority)}
                                      </Badge>
                                    </div>
                                    
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                    )}
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      {task.estimated_hours && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {task.estimated_hours}h
                                        </div>
                                      )}
                                      {task.assignee_id && (
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {teamMembers.find(m => m.user_id === task.assignee_id)?.user?.full_name || 
                                           teamMembers.find(m => m.user_id === task.assignee_id)?.user?.email || 
                                           'Responsável'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingTask(task)
                                        setTaskForm({
                                          title: task.title,
                                          description: task.description || '',
                                          priority: task.priority,
                                          estimated_hours: task.estimated_hours || 1,
                                          assignee_id: task.assignee_id || 'none'
                                        })
                                      }}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Add Task Form */}
                        {isAddingTask === stage.id && (
                          <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg">
                            <div className="space-y-3">
                              <Input
                                placeholder="Título da tarefa"
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                              />
                              <Textarea
                                placeholder="Descrição (opcional)"
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                rows={2}
                              />
                              <div className="grid grid-cols-3 gap-3">
                                <Select
                                  value={taskForm.priority}
                                  onValueChange={(value: Task['priority']) => 
                                    setTaskForm({ ...taskForm, priority: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Prioridade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                  </SelectContent>
                                </Select>
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
                              
                              {/* Responsável em linha separada */}
                              <div className="w-full">
                                <Select
                                  value={taskForm.assignee_id}
                                  onValueChange={(value) => setTaskForm({ ...taskForm, assignee_id: value })}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecionar responsável" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem responsável</SelectItem>
                                    {teamMembers.map((member) => (
                                      <SelectItem key={member.user_id} value={member.user_id}>
                                        {member.user?.full_name || member.user?.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleCreateTask(stage.id)}
                                  disabled={!taskForm.title.trim()}
                                >
                                  Adicionar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsAddingTask(null)
                                    setTaskForm({ title: '', description: '', priority: 'medium', estimated_hours: 1, assignee_id: '' })
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum estágio criado</h3>
          <p className="text-gray-600 mb-4">Comece criando o primeiro estágio do seu projeto.</p>
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
              <label className="text-sm font-medium">Título</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Título da tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Descrição da tarefa"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: Task['priority']) => 
                    setTaskForm({ ...taskForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Duração (horas)</label>
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
                <label className="text-sm font-medium">Responsável</label>
                <Select
                  value={taskForm.assignee_id}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assignee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sem responsável</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user?.full_name || member.user?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
    </div>
  )
}