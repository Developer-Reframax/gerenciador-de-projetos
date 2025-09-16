'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Calendar, Users, Target, Trash2, Edit, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProjectMutations } from '@/hooks/use-projects'
import type { Project } from '@/types/project'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS
} from '@/types/project'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  onRefetch?: () => void
}

export function ProjectCard({ project, onEdit, onDelete, onRefetch }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteProject } = useProjectMutations()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return

    setIsDeleting(true)
    const success = await deleteProject(project.id)
    
    if (success) {
      onDelete?.(project.id)
      onRefetch?.()
    }
    
    setIsDeleting(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleViewDetails = () => {
    router.push(`/projects/${project.id}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status e Prioridade */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={PROJECT_STATUS_COLORS[project.status]}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
          <Badge 
            variant="outline" 
            className={PROJECT_PRIORITY_COLORS[project.priority]}
          >
            {PROJECT_PRIORITY_LABELS[project.priority]}
          </Badge>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{project.progress_percentage}%</span>
          </div>
          <Progress value={project.progress_percentage} className="h-2" />
        </div>

        {/* Informações do projeto */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tarefas:</span>
            <span className="font-medium">
              {project.completed_tasks || 0}/{project.total_tasks || 0}
            </span>
          </div>
          
          {project.team && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {project.team.name}
              </span>
            </div>
          )}
        </div>

        {/* Datas */}
        {(project.start_date || project.due_date) && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(project.start_date)} - {formatDate(project.due_date)}
            </span>
          </div>
        )}

        {/* Dono do projeto */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={project.owner?.full_name || ''} />
            <AvatarFallback className="text-xs">
              {getInitials(project.owner?.full_name || project.owner?.email || '')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {project.owner?.full_name || project.owner?.email}
          </span>
        </div>

        {/* Botão Ver Detalhes */}
        <div className="pt-2">
          <Button 
            onClick={handleViewDetails}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}