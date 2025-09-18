'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  FolderKanban,
  Activity,
  Loader2
} from 'lucide-react'


// Interfaces para as respostas das APIs
interface StatsResponse {
  data: {
    activeProjects: number
    pendingTasks: number
    completedTasks: number
    teamMembers: number
  }
}

interface ProjectResponse {
  data: Array<{
    id: string
    name: string
    description: string | null
    status: string
    priority: string
    progress_percentage: number | null
    due_date: string | null
    total_tasks: number | null
    completed_tasks: number | null
    owner: {
      full_name: string | null
      avatar_url: string | null
    }
  }>
}

interface ActivityResponse {
  data: Array<{
    id: string
    user: {
      id: string
      name: string
      avatar: string
    }
    description: string
    timestamp: string
    type: string
  }>
}

// Interfaces para os dados da API
interface DashboardStats {
  activeProjects: number
  pendingTasks: number
  completedTasks: number
  teamMembers: number
}

interface RecentProject {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  progress_percentage: number | null
  due_date: string | null
  total_tasks: number | null
  completed_tasks: number | null
  owner: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface RecentActivity {
  id: string
  description: string
  timestamp: string
  type: string
  user: {
    id: string
    name: string
    avatar: string
  }
}

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  href?: string
  color: string
}

const getQuickActions = (onCreateProject: () => void) => [
  {
    title: "Novo Projeto",
    description: "Criar um novo projeto para sua equipe",
    icon: FolderKanban,
    onClick: onCreateProject,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    title: "Convidar Membros",
    description: "Adicionar novos membros à equipe",
    icon: Users,
    href: "/teams/invite",
    color: "bg-green-500 hover:bg-green-600"
  }
]

// Função para formatar tempo relativo
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) {
    return 'Agora mesmo'
  } else if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
  } else if (diffInDays < 7) {
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
  } else {
    return date.toLocaleDateString('pt-BR')
  }
}

// Função para formatar data
function formatDate(dateString: string | null): string {
  if (!dateString) return 'Não definido'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProject = useCallback(() => {
    // TODO: Implementar criação de projeto
    console.log('Criar novo projeto')
  }, [])

  const quickActions = useMemo(() => getQuickActions(handleCreateProject), [handleCreateProject])

  // Carregar dados da dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Carregar dados em paralelo
        const [statsResponse, projectsResponse, activitiesResponse] = await Promise.all([
          apiClient.get('/api/dashboard/stats'),
          apiClient.get('/api/dashboard/recent-projects'),
          apiClient.get('/api/dashboard/activities')
        ])

        setStats((statsResponse as StatsResponse).data)
        setRecentProjects((projectsResponse as ProjectResponse).data)
        setRecentActivities((activitiesResponse as ActivityResponse).data)
      } catch (err) {
        console.error('Erro ao carregar dados da dashboard:', err)
        setError('Erro ao carregar dados da dashboard. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Dados das estatísticas formatados
  const dashboardStats = stats ? [
    {
      title: "Projetos Ativos",
      value: stats.activeProjects.toString(),
      change: "+2 este mês",
      icon: FolderKanban,
      color: "text-blue-600"
    },
    {
      title: "Tarefas Pendentes",
      value: stats.pendingTasks.toString(),
      change: "-5 esta semana",
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Tarefas Concluídas",
      value: stats.completedTasks.toString(),
      change: "+23 esta semana",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Membros da Equipe",
      value: stats.teamMembers.toString(),
      change: "+3 este mês",
      icon: Users,
      color: "text-purple-600"
    }
  ] : []

  // Estado de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    )
  }

  // Estado de erro
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo dos seus projetos.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1">
              {quickActions.map((action: QuickAction, index: number) => {
                const Icon = action.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    onClick={action.onClick}
                    asChild={!action.onClick}
                  >
                    {action.onClick ? (
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${action.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">{action.title}</div>
                          <div className="text-xs text-muted-foreground break-words overflow-hidden">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <a href={action.href}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-md ${action.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium truncate">{action.title}</div>
                            <div className="text-xs text-muted-foreground break-words overflow-hidden">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </a>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas atividades da sua equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!recentActivities || recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar || undefined} alt={activity.user.name} />
                      <AvatarFallback>
                        {activity.user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-sm break-words">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}{activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projetos Recentes
          </CardTitle>
          <CardDescription>
            Seus projetos mais atualizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!recentProjects || recentProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum projeto encontrado</p>
              </div>
            ) : (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge variant={project.status === "active" ? "default" : "secondary"}>
                        {project.status === "active" ? "Ativo" : 
                         project.status === "completed" ? "Concluído" : 
                         project.status === "planning" ? "Planejamento" :
                         project.status === "on_hold" ? "Pausado" :
                         project.status === "cancelled" ? "Cancelado" : "Desconhecido"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Prazo: {project.due_date ? formatDate(project.due_date) : 'Não definido'}</span>
                      <span>Progresso: {project.progress_percentage || 0}%</span>
                      <span>Tarefas: {project.completed_tasks || 0}/{project.total_tasks || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${project.progress_percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={project.owner.avatar_url || undefined} />
                    </Avatar>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
