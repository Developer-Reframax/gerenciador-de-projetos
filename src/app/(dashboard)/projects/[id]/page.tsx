'use client'

import { useParams } from 'next/navigation'
import { useProject } from '@/hooks/use-projects'
import { useProjectDeviations } from '@/hooks/use-project-deviations'
import { useProjectMembers } from '@/hooks/use-project-members'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'
import { ProjectSchedule } from '@/components/projects/project-schedule'
import { ProjectComments } from '@/components/comments/project-comments'
import { ProjectAttachments } from '@/components/projects/project-attachments'
import { ProjectLogsTab } from '@/components/projects/project-logs-tab'

import { ProjectStrategicInfo } from '@/components/projects/project-strategic-info'
import { DeviationList } from '@/components/projects/deviation-list'

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params?.id as string
  const { project, loading, error } = useProject(projectId)
  const { deviations, refetch: refetchDeviations } = useProjectDeviations(projectId)
  const { members: teamMembers, loading: membersLoading } = useProjectMembers(projectId)

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Projeto não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'O projeto solicitado não existe ou você não tem permissão para visualizá-lo.'}</p>
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
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'not_started': return 'bg-purple-100 text-purple-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Em execução'
      case 'completed': return 'Concluído'
      case 'not_started': return 'Não Iniciado'
      case 'paused': return 'Paralisado'
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
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
        <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="strategic">Estratégico</TabsTrigger>
              <TabsTrigger value="schedule">Itens de Trabalho</TabsTrigger>
              <TabsTrigger value="deviations">
                Desvios
              </TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

        {/* Aba Detalhes */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Informações Gerais</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Classificação – Prioridade Estratégica:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    project.priority === 'priority' ? 'bg-red-100 text-red-800' :
                    project.priority === 'important' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.priority === 'priority' ? 'Prioritário' :
                     project.priority === 'important' ? 'Importante' : 'Tático'}
                  </span>
                </div>

              </div>
            </div>

            {/* Responsáveis */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Responsáveis</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Proprietário:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                     {project.owner?.full_name || project.owner?.email || 'Não definido'}
                   </span>
                </div>
                


                {project.team && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Membros da Equipe:</span>
                    {membersLoading ? (
                      <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">Carregando...</div>
                    ) : teamMembers && teamMembers.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-sm font-medium dark:text-gray-300">
                              {member.name || member.email}
                            </div>
                            {member.name && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.email}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">Nenhum membro encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {project.total_tasks || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total de Tarefas</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {project.completed_tasks || 0}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Concluídas</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {(project.total_tasks || 0) - (project.completed_tasks || 0)}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {project.progress_percentage || 0}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Progresso</div>
                </div>
              </div>
            </div>
          </div>


        </TabsContent>

        {/* Aba Estratégico */}
        <TabsContent value="strategic">
          <ProjectStrategicInfo projectId={projectId} />
        </TabsContent>

        {/* Aba Itens de Trabalho */}
        <TabsContent value="schedule">
          <ProjectSchedule projectId={projectId} />
        </TabsContent>

        {/* Aba Desvios */}
        <TabsContent value="deviations">
          <DeviationList 
            projectId={projectId} 
            deviations={deviations} 
            onRefresh={refetchDeviations} 
          />
        </TabsContent>

        {/* Aba Comentários */}
        <TabsContent value="comments">
          <ProjectComments projectId={projectId} />
        </TabsContent>

        {/* Aba Anexos */}
        <TabsContent value="attachments">
          <ProjectAttachments projectId={projectId} />
        </TabsContent>

        {/* Aba Logs */}
        <TabsContent value="logs">
          <ProjectLogsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}