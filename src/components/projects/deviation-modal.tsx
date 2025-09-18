'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DeviationForm } from '@/components/projects/deviation-form'
import type { ProjectDeviation } from '@/types/database'

interface DeviationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  deviation?: ProjectDeviation
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function DeviationModal({ 
  open, 
  onOpenChange, 
  projectId, 
  deviation, 
  mode, 
  onSuccess 
}: DeviationModalProps) {
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
            {mode === 'create' ? 'Novo Desvio' : 'Editar Desvio'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Registre um novo desvio para o projeto.'
              : 'Edite as informações do desvio.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <DeviationForm 
          projectId={projectId}
          deviation={deviation}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  )
}
