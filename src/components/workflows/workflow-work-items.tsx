'use client'

import { useState } from 'react'
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
import { Plus, Edit, CheckSquare, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkflowStages } from '@/hooks/use-workflow-stages'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import type { WorkflowStage, WorkflowTask, WorkflowImpediment } from '@/types/workflow'

interface WorkflowWorkItemsProps {
  workflowId: string
}

export function WorkflowWorkItems({ workflowId }: WorkflowWorkItemsProps) {
  const { stages, loading, refetch } = useWorkflowStages(workflowId)
  const { user } = useAuth()
  
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null)
  const [isAddingImpediment, setIsAddingImpediment] = useState<{ stageId: string; taskId: string } | null>(null)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null)
  const [editingTask, setEditingTask] = useState<WorkflowTask | null>(null)
  const [editingImpediment, setEditingImpediment] = useState<WorkflowImpediment | null>(null)
  
  const [stageForm, setStageForm] = useState({
    name: '',
    description: ''
  })
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'media' as WorkflowTask['priority'],
    assigned_to: ''
  })
  
  const [impedimentForm, setImpedimentForm] = useState({
    title: '',
    description: '',
    severity: 'media' as WorkflowImpediment['severity'],
    reported_by: ''
  })

  const handleCreateStage = async () => {
    if (!stageForm.name.trim()) return
    
    try {
      await apiClient.post(`/api/workflows/${workflowId}/work-items`, stageForm)
      
      setIsAddingStage(false)
      setStageForm({ name: '', description: '' })
      refetch()
    } catch (error) {
      console.error('Error creating stage:', error)
    }
  }

  const handleUpdateStage = async () => {
    if (!editingStage || !stageForm.name.trim()) return
    
    try {
      await apiClient.put(`/api/workflows/${workflowId}/work-items/${editingStage.id}`, stageForm)
      setEditingStage(null)
      setStageForm({ name: '', description: '' })
      refetch()
    } catch (error) {
      console.error('Error updating stage:', error)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa? Todas as tarefas serão removidas.')) return
    
    try {
      await apiClient.delete(`/api/workflows/${workflowId}/work-items/${stageId}`)
      refetch()
    } catch (error) {
      console.error('Error deleting stage:', error)
    }
  }

  const handleCreateTask = async (stageId: string) => {
    if (!taskForm.title.trim()) return
    
    try {
      const stage = stages.find(s => s.id === stageId)
      const taskCount = (stage as WorkflowStage & { workflow_tasks?: WorkflowTask[] })?.workflow_tasks?.length || 0
      
      await apiClient.post(`/api/workflows/${workflowId}/stages/${stageId}/tasks`, {
        ...taskForm,
        assigned_to: user?.id || null,
        position: taskCount
      })
      
      setIsAddingTask(null)
      setTaskForm({ title: '', description: '', priority: 'media', assigned_to: '' })
      refetch()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim()) return
    
    try {
      await apiClient.put(`/api/workflows/${workflowId}/tasks/${editingTask.id}`, taskForm)
      
      setEditingTask(null)
      setTaskForm({ title: '', description: '', priority: 'media', assigned_to: '' })
      refetch()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleToggleTaskComplete = async (task: WorkflowTask) => {
    try {
      const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida'
        
      await apiClient.put(`/api/workflows/${workflowId}/tasks/${task.id}`, {
        ...task,
        status: newStatus
      })
      refetch()
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return
    
    try {
      await apiClient.delete(`/api/workflows/${workflowId}/tasks/${taskId}`)
      refetch()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleCreateImpediment = async () => {
    if (!impedimentForm.title.trim() || !isAddingImpediment) return
    
    try {
      await apiClient.post(`/api/workflows/${workflowId}/stages/${isAddingImpediment.stageId}/impediments`, {
        title: impedimentForm.title,
        description: impedimentForm.description,
        severity: impedimentForm.severity
      })
      
      setIsAddingImpediment(null)
      setImpedimentForm({ title: '', description: '', severity: 'media', reported_by: '' })
      refetch()
    } catch (error) {
      console.error('Error creating impediment:', error)
    }
  }

  const handleUpdateImpediment = async () => {
    if (!editingImpediment || !impedimentForm.title.trim()) return
    
    try {
      await apiClient.put(`/api/workflows/${workflowId}/impediments/${editingImpediment.id}`, impedimentForm)
      
      setEditingImpediment(null)
      setImpedimentForm({ title: '', description: '', severity: 'media', reported_by: '' })
      refetch()
    } catch (error) {
      console.error('Error updating impediment:', error)
    }
  }

  const handleDeleteImpediment = async (impedimentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este impedimento?')) return
    
    try {
      await apiClient.delete(`/api/workflows/${workflowId}/impediments/${impedimentId}`)
      refetch()
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'alta': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'critica': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'em_andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'concluida': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'bloqueada': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getImpedimentStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'em_resolucao': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'resolvido': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando itens de trabalho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Itens de Trabalho</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie as etapas, tarefas e impedimentos do workflow</p>
        </div>
        <Button onClick={() => setIsAddingStage(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Etapa
        </Button>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage) => {
          const isExpanded = expandedStages.has(stage.id)
          const tasks = (stage as WorkflowStage & { workflow_tasks?: WorkflowTask[] }).workflow_tasks || []
          const impediments = (stage as WorkflowStage & { workflow_impediments?: WorkflowImpediment[] }).workflow_impediments || []
          
          return (
            <Card key={stage.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStageExpansion(stage.id)}
                      className="p-1 h-auto"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{stage.name}</CardTitle>
                      {stage.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      {tasks.length} tarefas
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {impediments.length} impedimentos
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingStage(stage)
                            setStageForm({ name: stage.name, description: stage.description || '' })
                          }}
                        >
                          Editar Etapa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteStage(stage.id)}
                          className="text-red-600"
                        >
                          Excluir Etapa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Tasks Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Tarefas</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsAddingTask(stage.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Tarefa
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleTaskComplete(task)}
                                className="p-1 h-auto"
                              >
                                {task.status === 'concluida' ? (
                                  <CheckSquare className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-400 rounded" />
                                )}
                              </Button>
                              <div>
                                <p className={`font-medium ${
                                  task.status === 'concluida' 
                                    ? 'line-through text-gray-500' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingTask(task)
                                      setTaskForm({
                                        title: task.title,
                                        description: task.description || '',
                                        priority: task.priority,
                                        assigned_to: task.assigned_to || ''
                                      })
                                    }}
                                  >
                                    Editar Tarefa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setIsAddingImpediment({ stageId: stage.id, taskId: task.id })}
                                  >
                                    Adicionar Impedimento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-600"
                                  >
                                    Excluir Tarefa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                        
                        {tasks.length === 0 && (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            Nenhuma tarefa cadastrada
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Impediments Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Impedimentos</h4>
                        {tasks.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsAddingImpediment({ stageId: stage.id, taskId: '' })
                              setImpedimentForm({ title: '', description: '', severity: 'media', reported_by: '' })
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar Impedimento
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {impediments.map((impediment: WorkflowImpediment) => (
                          <div
                            key={impediment.id}
                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                          >
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {impediment.title}
                                </p>
                                {impediment.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {impediment.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(impediment.severity)}>
                                {impediment.severity}
                              </Badge>
                              <Badge className={getImpedimentStatusColor(impediment.status)}>
                                {impediment.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingImpediment(impediment)
                                      setImpedimentForm({
                                        title: impediment.title,
                                        description: impediment.description || '',
                                        severity: impediment.severity,
                                        reported_by: impediment.reported_by || ''
                                      })
                                    }}
                                  >
                                    Editar Impedimento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteImpediment(impediment.id)}
                                    className="text-red-600"
                                  >
                                    Excluir Impedimento
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                        
                        {impediments.length === 0 && (
                          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            Nenhum impedimento cadastrado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
        
        {stages.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma etapa cadastrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comece criando a primeira etapa do seu workflow
              </p>
              <Button onClick={() => setIsAddingStage(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Etapa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={isAddingStage} onOpenChange={setIsAddingStage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Etapa</DialogTitle>
            <DialogDescription>
              Crie uma nova etapa para organizar as tarefas do workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Etapa</label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Digite o nome da etapa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder="Descreva o objetivo desta etapa"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingStage(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateStage}>
                Criar Etapa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etapa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Etapa</label>
              <Input
                value={stageForm.name}
                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                placeholder="Digite o nome da etapa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder="Descreva o objetivo desta etapa"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingStage(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateStage}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={!!isAddingTask} onOpenChange={() => setIsAddingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título da Tarefa</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Descreva a tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={taskForm.priority}
                onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as WorkflowTask['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingTask(null)}>
                Cancelar
              </Button>
              <Button onClick={() => isAddingTask && handleCreateTask(isAddingTask)}>
                Criar Tarefa
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
              <label className="text-sm font-medium">Título da Tarefa</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Descreva a tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Prioridade</label>
              <Select
                value={taskForm.priority}
                onValueChange={(value) => setTaskForm({ ...taskForm, priority: value as WorkflowTask['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateTask}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Impediment Dialog */}
      <Dialog 
        open={!!isAddingImpediment} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingImpediment(null)
            setImpedimentForm({ title: '', description: '', severity: 'media', reported_by: '' })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Impedimento</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Descreva o impedimento encontrado nesta etapa
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título do Impedimento</label>
              <Input
                value={impedimentForm.title}
                onChange={(e) => setImpedimentForm({ ...impedimentForm, title: e.target.value })}
                placeholder="Digite o título do impedimento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={impedimentForm.description}
                onChange={(e) => setImpedimentForm({ ...impedimentForm, description: e.target.value })}
                placeholder="Descreva o impedimento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Severidade</label>
              <Select
                value={impedimentForm.severity}
                onValueChange={(value) => setImpedimentForm({ ...impedimentForm, severity: value as WorkflowImpediment['severity'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingImpediment(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateImpediment}
                disabled={!impedimentForm.title.trim()}
              >
                Criar Impedimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Impediment Dialog */}
      <Dialog open={!!editingImpediment} onOpenChange={() => setEditingImpediment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Impedimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título do Impedimento</label>
              <Input
                value={impedimentForm.title}
                onChange={(e) => setImpedimentForm({ ...impedimentForm, title: e.target.value })}
                placeholder="Digite o título do impedimento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={impedimentForm.description}
                onChange={(e) => setImpedimentForm({ ...impedimentForm, description: e.target.value })}
                placeholder="Descreva o impedimento"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Severidade</label>
              <Select
                value={impedimentForm.severity}
                onValueChange={(value) => setImpedimentForm({ ...impedimentForm, severity: value as WorkflowImpediment['severity'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingImpediment(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateImpediment}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}