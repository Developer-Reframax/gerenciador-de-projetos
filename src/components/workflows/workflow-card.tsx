'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Calendar, Target, Trash2, Edit, Eye, Workflow as WorkflowIcon } from 'lucide-react'
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
import { useWorkflowMutations } from '@/hooks/use-workflows'
import type { Workflow } from '@/types/workflow'
import {
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_PRIORITY_LABELS,
  WORKFLOW_STATUS_COLORS,
  WORKFLOW_PRIORITY_COLORS,
  WORKFLOW_CATEGORY_LABELS
} from '@/types/workflow'

interface WorkflowCardProps {
  workflow: Workflow
  onEdit?: (workflow: Workflow) => void
  onDelete?: (workflowId: string) => void
  onRefetch?: () => void
}

export function WorkflowCard({ workflow, onEdit, onDelete, onRefetch }: WorkflowCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteWorkflow } = useWorkflowMutations()
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este fluxo de trabalho?')) return

    setIsDeleting(true)
    const success = await deleteWorkflow(workflow.id)
    
    if (success) {
      onDelete?.(workflow.id)
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
    router.push(`/workflows/${workflow.id}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-lg break-words leading-tight">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-1 break-words line-clamp-3 leading-relaxed">
                {workflow.description}
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
              <DropdownMenuItem onClick={() => onEdit?.(workflow)}>
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
        {/* Status, Prioridade e Categoria */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="secondary" 
            className={WORKFLOW_STATUS_COLORS[workflow.status]}
          >
            {WORKFLOW_STATUS_LABELS[workflow.status]}
          </Badge>
          <Badge 
            variant="outline" 
            className={WORKFLOW_PRIORITY_COLORS[workflow.priority]}
          >
            {WORKFLOW_PRIORITY_LABELS[workflow.priority]}
          </Badge>
          <Badge variant="outline">
            {WORKFLOW_CATEGORY_LABELS[workflow.category]}
          </Badge>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{workflow.progress_percentage}%</span>
          </div>
          <Progress value={workflow.progress_percentage} className="h-2" />
        </div>

        {/* Informações do workflow */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Etapas:</span>
            <span className="font-medium">
              {workflow.completed_stages || 0}/{workflow.total_stages || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tarefas:</span>
            <span className="font-medium">
              {workflow.completed_tasks || 0}/{workflow.total_tasks || 0}
            </span>
          </div>
        </div>

        {/* Datas */}
        {(workflow.start_date || workflow.end_date) && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(workflow.start_date)} - {formatDate(workflow.end_date)}
            </span>
          </div>
        )}

        {/* Criador do workflow */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={workflow.creator?.full_name || ''} />
            <AvatarFallback className="text-xs">
              {getInitials(workflow.creator?.full_name || workflow.creator?.email || '')}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground truncate">
            {workflow.creator?.full_name || workflow.creator?.email}
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