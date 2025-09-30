'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Edit, Save, X, Plus, Target, Users, Calendar, DollarSign, Tag, UserCheck, Building, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type {
  StrategicPillar,
  Tag as TagType,
  Area,
  Stakeholder,
  ProjectStrategicInfoResponse,
  UpdateProjectStrategicForm
} from '@/types'
import { AreasManager } from '@/components/projects/areas-manager'
import { StakeholdersManager } from '@/components/projects/stakeholders-manager'

interface ProjectStrategicInfoProps {
  projectId: string
}

export function ProjectStrategicInfo({ projectId }: ProjectStrategicInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectData, setProjectData] = useState<ProjectStrategicInfoResponse | null>(null)

  const [pillars, setPillars] = useState<StrategicPillar[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [lessonsLearned, setLessonsLearned] = useState<string>('')
  const [formData, setFormData] = useState<UpdateProjectStrategicForm & {
    area_ids?: string[]
    stakeholder_ids?: string[]
    lessons_learned?: string
  }>({})
  
  // Estados para modais de criação
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false)
  const [isCreatePillarOpen, setIsCreatePillarOpen] = useState(false)
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false)
  
  // Estados para formulários de criação
  const [newObjective, setNewObjective] = useState({ name: '', description: '' })
  const [newPillar, setNewPillar] = useState({ name: '', description: '' })
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' })
  
  // Estados de loading para criação
  const [creatingObjective, setCreatingObjective] = useState(false)
  const [creatingPillar, setCreatingPillar] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Carregar informações estratégicas do projeto
      const [projectRes, pillarsRes, tagsRes, areasRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/strategic`),
        fetch('/api/strategic-pillars'),
        fetch('/api/tags'),
        fetch('/api/areas')
      ])

      let projectAreasIds: string[] = []
      let projectData: ProjectStrategicInfoResponse | null = null
      
      if (projectRes.ok) {
        const projectResponse = await projectRes.json()
        projectData = projectResponse.data
        setProjectData(projectData)
        
        // Extrair IDs das áreas do projeto
        projectAreasIds = projectData?.areas?.map((area: Area) => area.id) || []
        
        const stakeholders = projectData?.stakeholders?.map((stakeholder: { id: string; full_name?: string; email?: string; role?: string }) => ({
          id: stakeholder.id,
          user_id: stakeholder.id,
          user_name: stakeholder.full_name || 'Usuário não encontrado',
          user_email: stakeholder.email || '',
          role: stakeholder.role || ''
        })).filter(Boolean) || []
        setStakeholders(stakeholders)
        setLessonsLearned(projectData?.lessons_learned || '')
        setFormData({
          strategic_objective_id: projectData?.strategic_objective_id,
          strategic_objective_text: projectData?.strategic_objective_text,
          strategic_pillar_id: projectData?.strategic_pillar_id,
          request_date: projectData?.request_date,
          committee_approval_date: projectData?.committee_approval_date,
          real_start_date: projectData?.real_start_date,
          real_end_date: projectData?.real_end_date,
          start_date: projectData?.start_date,
          due_date: projectData?.due_date,
          budget: projectData?.budget,
          owner_name: projectData?.owner_name,
          direct_responsibles: projectData?.direct_responsibles,
          requesting_area: projectData?.requesting_area,
          planned_budget: projectData?.planned_budget,
          used_budget: projectData?.used_budget,
          tag_ids: projectData?.tags?.map((tag: { id: string }) => tag.id) || [],
          area_ids: projectAreasIds,
          stakeholder_ids: stakeholders.map((stakeholder: { user_id: string }) => stakeholder.user_id) || [],
          lessons_learned: projectData?.lessons_learned || ''
        })
      }



      if (pillarsRes.ok) {
        const pillarsData = await pillarsRes.json()
        setPillars(pillarsData.data)
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json()
        setTags(tagsData.data)
      }

      if (areasRes.ok) {
        const areasData = await areasRes.json()
        const allAreas = areasData.data || []
        
        // Se temos dados do projeto, mostrar apenas as áreas selecionadas no modo visualização
        // No modo edição, o AreasManager carregará todas as áreas disponíveis
        if (projectData && projectData.areas) {
          setAreas(projectData.areas)
        } else {
          setAreas(allAreas)
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar dados estratégicos:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar informações estratégicas'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [projectId, loadData])

  const handleSave = async () => {

    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/strategic`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          area_ids: formData.area_ids || [],
          stakeholder_ids: formData.stakeholder_ids || [],
          lessons_learned: formData.lessons_learned || ''
        })
      })

      if (response.ok) {
        toast.success('Informações estratégicas atualizadas com sucesso')
        setIsEditing(false)
        await loadData() // Recarregar dados
      } else {
        const error = await response.json()
        const errorMessage = error.message || 'Erro ao atualizar informações estratégicas'
        toast.error(errorMessage)
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar informações estratégicas'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Resetar form data
    if (projectData) {
      setFormData({
        strategic_objective_id: projectData.strategic_objective_id,
        strategic_objective_text: projectData.strategic_objective_text,
        strategic_pillar_id: projectData.strategic_pillar_id,
        request_date: projectData.request_date,
        committee_approval_date: projectData.committee_approval_date,
        real_start_date: projectData.real_start_date,
        real_end_date: projectData.real_end_date,
        start_date: projectData.start_date,
        due_date: projectData.due_date,
        budget: projectData.budget,
        owner_name: projectData.owner_name,
        direct_responsibles: projectData.direct_responsibles,
        requesting_area: projectData.requesting_area,
        planned_budget: projectData.planned_budget,
        used_budget: projectData.used_budget,
        tag_ids: projectData.tags?.map((tag: { id: string }) => tag.id) || [],
        area_ids: projectData.areas?.map((area: { id: string }) => area.id) || [],
        stakeholder_ids: projectData.stakeholders?.map((stakeholder: { user_id: string }) => stakeholder.user_id) || [],
        lessons_learned: projectData.lessons_learned || ''
      })
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não definida'
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
  }

  // Funções para criação de novos itens
  const handleCreateObjective = async () => {
    if (!newObjective.name.trim()) {
      toast.error('Nome do objetivo é obrigatório')
      return
    }

    setCreatingObjective(true)
    try {
      const response = await fetch('/api/strategic-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newObjective)
      })

      if (response.ok) {
        const result = await response.json()
        const newObj = result.data

        setFormData(prev => ({ ...prev, strategic_objective_id: newObj.id }))
        setNewObjective({ name: '', description: '' })
        setIsCreateObjectiveOpen(false)
        toast.success('Objetivo estratégico criado com sucesso')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao criar objetivo estratégico')
      }
    } catch (error: unknown) {
      console.error('Erro ao criar objetivo:', error)
      toast.error('Erro ao criar objetivo estratégico')
    } finally {
      setCreatingObjective(false)
    }
  }

  const handleCreatePillar = async () => {
    if (!newPillar.name.trim()) {
      toast.error('Nome do pilar é obrigatório')
      return
    }

    setCreatingPillar(true)
    try {
      const response = await fetch('/api/strategic-pillars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPillar)
      })

      if (response.ok) {
        const result = await response.json()
        const newPil = result.data
        setPillars(prev => [...prev, newPil])
        setFormData(prev => ({ ...prev, strategic_pillar_id: newPil.id }))
        setNewPillar({ name: '', description: '' })
        setIsCreatePillarOpen(false)
        toast.success('Pilar estratégico criado com sucesso')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao criar pilar estratégico')
      }
    } catch (error: unknown) {
      console.error('Erro ao criar pilar:', error)
      toast.error('Erro ao criar pilar estratégico')
    } finally {
      setCreatingPillar(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Nome da tag é obrigatório')
      return
    }

    setCreatingTag(true)
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      })

      if (response.ok) {
        const result = await response.json()
        const newTagItem = result.data
        setTags(prev => [...prev, newTagItem])
        const currentTags = formData.tag_ids || []
        setFormData(prev => ({ ...prev, tag_ids: [...currentTags, newTagItem.id] }))
        setNewTag({ name: '', color: '#3b82f6' })
        setIsCreateTagOpen(false)
        toast.success('Tag criada com sucesso')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao criar tag')
      }
    } catch (error: unknown) {
      console.error('Erro ao criar tag:', error)
      toast.error('Erro ao criar tag')
    } finally {
      setCreatingTag(false)
    }
  }



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Informações Estratégicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Informações Estratégicas
          </CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bloco 1: Informações Gerais */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-600" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Target className="h-4 w-4" />
                  Objetivo Estratégico *
                </Label>
                {isEditing ? (
                  <Textarea
                    placeholder="Descreva o objetivo estratégico do projeto..."
                    value={formData.strategic_objective_text || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, strategic_objective_text: e.target.value }))}
                    className="min-h-[100px]"
                    required
                  />
                ) : (
                  <div className="text-sm p-4 bg-muted/30 rounded-lg min-h-[100px] border">
                    {projectData?.strategic_objective_text || 'Não definido'}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Layers className="h-4 w-4" />
                  Pilar Estratégico
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.strategic_pillar_id || 'none'}
                    onValueChange={(value) => {
                      if (value === 'create-new') {
                        setIsCreatePillarOpen(true)
                      } else {
                        setFormData(prev => ({ ...prev, strategic_pillar_id: value === 'none' ? null : value }))
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um pilar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {pillars.map(pillar => (
                        <SelectItem key={pillar.id} value={pillar.id}>
                          {pillar.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new" className="text-blue-600 font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        + Criar Novo Pilar
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">
                    {projectData?.strategic_pillar?.name || 'Não definido'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2 font-medium">
                <Building className="h-4 w-4" />
                Área Demandante *
              </Label>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Digite uma área e pressione Enter para adicionar"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const value = e.currentTarget.value.trim()
                        if (value && !(formData.requesting_area || []).includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            requesting_area: [...(prev.requesting_area || []), value]
                          }))
                          e.currentTarget.value = ''
                        }
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {(formData.requesting_area || []).map((area, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            requesting_area: (prev.requesting_area || []).filter((_, i) => i !== index)
                          }))
                        }}
                      >
                        {area} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(projectData?.requesting_area || []).length > 0 ? (
                    (projectData?.requesting_area || []).map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhuma área definida</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: Responsabilidades */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              Responsabilidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <UserCheck className="h-4 w-4" />
                  Proprietário *
                </Label>
                {isEditing ? (
                  <Input
                    placeholder="Nome do proprietário do projeto"
                    value={formData.owner_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                    required
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">
                    {projectData?.owner_name || 'Não definido'}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Users className="h-4 w-4" />
                  Responsáveis Diretos *
                </Label>
                {isEditing ? (
                  <Input
                    placeholder="Nomes dos responsáveis diretos"
                    value={formData.direct_responsibles || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, direct_responsibles: e.target.value }))}
                    required
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">
                    {projectData?.direct_responsibles || 'Não definido'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3: Orçamento */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              Orçamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <DollarSign className="h-4 w-4" />
                  Orçamento Previsto (R$) *
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.planned_budget || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, planned_budget: e.target.value ? parseFloat(e.target.value) : null }))}
                    required
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border font-medium">
                    {projectData?.planned_budget ? `R$ ${projectData.planned_budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <DollarSign className="h-4 w-4" />
                  Orçamento Aprovado (R$)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border font-medium">
                    {projectData?.budget ? `R$ ${projectData.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <DollarSign className="h-4 w-4" />
                  Orçamento Utilizado (R$)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.used_budget || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, used_budget: e.target.value ? parseFloat(e.target.value) : null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border font-medium">
                    {projectData?.used_budget ? `R$ ${projectData.used_budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Indicador de Utilização do Orçamento */}
            {projectData?.planned_budget && projectData?.used_budget && (
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Utilização do Orçamento</span>
                  <span className="text-sm font-bold">
                    {((projectData.used_budget / projectData.planned_budget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(((projectData.used_budget / projectData.planned_budget) * 100), 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloco 4: Indicadores */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-purple-600" />
              Indicadores de Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {projectData?.total_tasks || 0}
                </div>
                <div className="text-sm font-medium text-blue-700">Total de Tarefas</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {projectData?.completed_tasks || 0}
                </div>
                <div className="text-sm font-medium text-green-700">Tarefas Concluídas</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {projectData?.pending_tasks || 0}
                </div>
                <div className="text-sm font-medium text-orange-700">Tarefas Pendentes</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {projectData?.progress_percentage || 0}%
                </div>
                <div className="text-sm font-medium text-purple-700">Progresso Geral</div>
              </div>
            </div>
            
            {/* Barra de Progresso Visual */}
            <div className="mt-6 p-4 bg-muted/20 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progresso do Projeto</span>
                <span className="text-sm font-bold">
                  {projectData?.progress_percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(projectData?.progress_percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 5: Datas Estratégicas */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Datas Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Data de Solicitação
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.request_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, request_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.request_date)}</div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Aprovação do Comitê
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.committee_approval_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, committee_approval_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.committee_approval_date)}</div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Início Planejado
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.start_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.start_date)}</div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Término Planejado
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.due_date)}</div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Início Real
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.real_start_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, real_start_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.real_start_date)}</div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Término Real
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.real_end_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, real_end_date: e.target.value || null }))}
                  />
                ) : (
                  <div className="text-sm p-3 bg-muted/30 rounded-lg border">{formatDate(projectData?.real_end_date)}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 6: Tags e Áreas */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-teal-600" />
              Tags e Áreas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags */}
            <div>
              <Label className="flex items-center gap-2 mb-3 font-medium">
                <Tag className="h-4 w-4" />
                Tags do Projeto
              </Label>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-muted/30 rounded-lg border">
                    {tags.filter(tag => formData.tag_ids?.includes(tag.id)).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTags = formData.tag_ids || []
                          const newTags = currentTags.filter(id => id !== tag.id)
                          setFormData(prev => ({ ...prev, tag_ids: newTags }))
                        }}
                        style={{
                          backgroundColor: tag.color || undefined
                        }}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                    {(!formData.tag_ids || formData.tag_ids.length === 0) && (
                      <span className="text-sm text-muted-foreground">Nenhuma tag selecionada</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(tag => !formData.tag_ids?.includes(tag.id)).map(tag => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          const currentTags = formData.tag_ids || []
                          const newTags = [...currentTags, tag.id]
                          setFormData(prev => ({ ...prev, tag_ids: newTags }))
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateTagOpen(true)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Criar Nova Tag
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-muted/30 rounded-lg border">
                  {projectData?.tags?.length ? (
                    projectData.tags.map((tag: { id: string; name: string; color?: string }) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color || undefined }}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhuma tag definida</span>
                  )}
                </div>
              )}
            </div>

            {/* Áreas */}
            <div>
              <Label className="flex items-center gap-2 mb-3 font-medium">
                <Building className="h-4 w-4" />
                Áreas do Projeto
              </Label>
              
              {isEditing ? (
                <AreasManager
                  selectedAreaIds={formData.area_ids || []}
                  onSelectionChange={(areaIds) => {
                    setFormData(prev => ({ ...prev, area_ids: areaIds }))
                  }}
                />
              ) : (
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-muted/30 rounded-lg border">
                  {areas.length > 0 ? (
                    areas.map((area) => (
                      <Badge
                        key={area.id}
                        variant="secondary"
                        className="px-3 py-1"
                        style={{ backgroundColor: area.color + '20', color: area.color }}
                      >
                        {area.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma área selecionada</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bloco 7: Stakeholders e Lições Aprendidas */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-orange-600" />
              Stakeholders e Lições Aprendidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stakeholders */}
            <div>
              <Label className="flex items-center gap-2 mb-3 font-medium">
                <Users className="h-4 w-4" />
                Stakeholders do Projeto
              </Label>
              
              {isEditing ? (
                <StakeholdersManager
                  selectedStakeholderIds={formData.stakeholder_ids || []}
                  onSelectionChange={(stakeholderIds) => {
                    setFormData(prev => ({ ...prev, stakeholder_ids: stakeholderIds }))
                  }}
                />
              ) : (
                <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 bg-muted/30 rounded-lg border">
                  {stakeholders.length > 0 ? (
                    stakeholders.map((stakeholder, index) => (
                      <Badge key={stakeholder.user_id || `stakeholder-${index}`} variant="secondary" className="px-3 py-1">
                        {stakeholder.user_name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Nenhum stakeholder selecionado</span>
                  )}
                </div>
              )}
            </div>

            {/* Lições Aprendidas */}
            <div>
              <Label className="flex items-center gap-2 mb-3 font-medium">
                <Target className="h-4 w-4" />
                Lições Aprendidas
              </Label>
              
              {isEditing ? (
                <Textarea
                  placeholder="Descreva as lições aprendidas do projeto..."
                  value={formData.lessons_learned || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, lessons_learned: e.target.value }))
                  }}
                  className="min-h-[120px] resize-none"
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap p-3 bg-muted/30 rounded-lg border min-h-[120px]">
                  {lessonsLearned ? (
                    lessonsLearned
                  ) : (
                    <span className="text-muted-foreground">Nenhuma lição aprendida registrada</span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>

    {/* Modal para criar novo objetivo estratégico */}
    <Dialog open={isCreateObjectiveOpen} onOpenChange={setIsCreateObjectiveOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Objetivo Estratégico</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="objective-name">Nome *</Label>
            <Input
              id="objective-name"
              value={newObjective.name}
              onChange={(e) => setNewObjective(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do objetivo"
            />
          </div>
          <div>
            <Label htmlFor="objective-description">Descrição</Label>
            <Textarea
              id="objective-description"
              value={newObjective.description}
              onChange={(e) => setNewObjective(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição do objetivo"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateObjectiveOpen(false)
                setNewObjective({ name: '', description: '' })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateObjective}
              disabled={creatingObjective || !newObjective.name.trim()}
            >
              {creatingObjective ? 'Criando...' : 'Criar Objetivo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal para criar novo pilar estratégico */}
    <Dialog open={isCreatePillarOpen} onOpenChange={setIsCreatePillarOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Pilar Estratégico</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pillar-name">Nome *</Label>
            <Input
              id="pillar-name"
              value={newPillar.name}
              onChange={(e) => setNewPillar(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do pilar"
            />
          </div>
          <div>
            <Label htmlFor="pillar-description">Descrição</Label>
            <Textarea
              id="pillar-description"
              value={newPillar.description}
              onChange={(e) => setNewPillar(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite a descrição do pilar"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatePillarOpen(false)
                setNewPillar({ name: '', description: '' })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePillar}
              disabled={creatingPillar || !newPillar.name.trim()}
            >
              {creatingPillar ? 'Criando...' : 'Criar Pilar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Modal para criar nova tag */}
    <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-name">Nome *</Label>
            <Input
              id="tag-name"
              value={newTag.name}
              onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da tag"
            />
          </div>
          <div>
            <Label htmlFor="tag-color">Cor</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="tag-color"
                type="color"
                value={newTag.color}
                onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10"
              />
              <Input
                value={newTag.color}
                onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTagOpen(false)
                setNewTag({ name: '', color: '#3b82f6' })
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={creatingTag || !newTag.name.trim()}
            >
              {creatingTag ? 'Criando...' : 'Criar Tag'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}