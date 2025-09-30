'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WorkflowForm } from './workflow-form'
import type { Workflow } from '@/types/workflow'

interface WorkflowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow?: Workflow | null
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function WorkflowModal({ open, onOpenChange, workflow, mode, onSuccess }: WorkflowModalProps) {
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
            {mode === 'create' ? 'Novo Fluxo de Trabalho' : 'Editar Fluxo de Trabalho'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Crie um novo fluxo de trabalho para organizar seus processos e tarefas.'
              : 'Edite as informações do fluxo de trabalho.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <WorkflowForm 
          workflow={workflow || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}