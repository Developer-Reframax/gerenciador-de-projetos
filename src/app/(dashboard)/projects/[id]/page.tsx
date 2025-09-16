'use client'

import { useParams } from 'next/navigation'
import { useProject } from '@/hooks/use-projects'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { ProjectSchedule } from '@/components/projects/project-schedule'
import { ProjectComments } from '@/components/comments/project-comments'
import { ProjectAttachments } from '@/components/projects/project-attachments'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { project, loading, error } = useProject(projectId)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projeto não encontrado</h2>
          <p className="text-gray-600 mb-4">{error || 'O projeto solicitado não existe ou você não tem permissão para visualizá-lo.'}</p>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Projetos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'completed': return 'Concluído'
      case 'on_hold': return 'Em Pausa'
      case 'cancelled': return 'Cancelado'
      default: return 'Desconhecido'
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(project.status || 'active')}>
                {getStatusText(project.status || 'active')}
              </Badge>
              {project.team && (
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {project.team.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="schedule">Cronograma</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
            </TabsList>

        {/* Aba Detalhes */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Prioridade:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    project.priority === 'high' ? 'bg-red-100 text-red-800' :
                    project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.priority === 'high' ? 'Alta' :
                     project.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Data de Início:</span>
                  <span className="ml-2 text-sm">
                    {project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Data de Término:</span>
                  <span className="ml-2 text-sm">
                    {project.due_date ? format(new Date(project.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Orçamento:</span>
                  <span className="ml-2 text-sm">
                    {project.budget ? `R$ ${project.budget.toLocaleString('pt-BR')}` : 'Não definido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Responsáveis */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Responsáveis</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Proprietário:</span>
                  <span className="ml-2 text-sm">
                    {project.owner?.full_name || project.owner?.email || 'Não definido'}
                  </span>
                </div>
                


                {project.team && (
                  <div>
                    <span className="text-sm text-gray-500">Equipe:</span>
                    <span className="ml-2 text-sm">{project.team.name}</span>
                    {project.team.description && (
                      <div className="text-sm text-gray-600 mt-1">{project.team.description}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {project.tasks?.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total de Tarefas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {project.tasks?.filter(task => task.status === 'completed').length || 0}
                  </div>
                  <div className="text-sm text-green-600">Concluídas</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(project.tasks?.length || 0) - (project.tasks?.filter(task => task.status === 'completed').length || 0)}
                  </div>
                  <div className="text-sm text-yellow-600">Pendentes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(project.tasks?.length || 0) > 0
                      ? Math.round(((project.tasks?.filter(task => task.status === 'completed').length || 0) / (project.tasks?.length || 1)) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-purple-600">Progresso</div>
                </div>
              </div>
            </div>
          </div>


        </TabsContent>

        {/* Aba Cronograma */}
        <TabsContent value="schedule">
          <ProjectSchedule projectId={projectId} />
        </TabsContent>

        {/* Aba Comentários */}
        <TabsContent value="comments">
          <ProjectComments projectId={projectId} />
        </TabsContent>

        {/* Aba Anexos */}
        <TabsContent value="attachments">
          <ProjectAttachments projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}