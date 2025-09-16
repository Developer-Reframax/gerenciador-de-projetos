'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectForm } from './project-form'
import type { Project } from '@/types/project'

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function ProjectModal({ open, onOpenChange, project, mode, onSuccess }: ProjectModalProps) {
  const handleSuccess = () => {
    onOpenChange(false)
    // Chama a função onSuccess se fornecida (para recarregar dados)
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Projeto' : 'Editar Projeto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crie um novo projeto para organizar suas tarefas e equipe.'
              : 'Edite as informações do projeto.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <ProjectForm 
          project={project}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}