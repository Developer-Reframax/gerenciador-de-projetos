'use client'

import { useState } from 'react'
import { CommentType, COMMENT_TYPE_CONFIG } from '@/types/comment'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  onSubmit: (content: string, type?: CommentType) => Promise<void>
  onCancel: () => void
  initialValue?: string
  initialType?: CommentType
  placeholder?: string
  submitLabel?: string
  showTypeSelector?: boolean
  loading?: boolean
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialValue = '',
  initialType = 'comment',
  placeholder = 'Escreva seu comentário...',
  submitLabel = 'Comentar',
  showTypeSelector = true,
  loading = false
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [type, setType] = useState<CommentType>(initialType)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), showTypeSelector ? type : undefined)
      setContent('')
      setType('comment')
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmitFromKeyboard()
    }
  }

  const handleSubmitFromKeyboard = async () => {
    if (!content.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), showTypeSelector ? type : undefined)
      setContent('')
      setType('comment')
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = loading || isSubmitting || !content.trim()

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seletor de tipo de comentário */}
      {showTypeSelector && (
        <div className="space-y-2">
          <Label htmlFor="comment-type" className="text-sm font-medium">
            Tipo de comentário
          </Label>
          <Select value={type} onValueChange={(value: CommentType) => setType(value)}>
            <SelectTrigger id="comment-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMMENT_TYPE_CONFIG).map(([key, config]) => {
                const IconComponent = config.icon
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {IconComponent && (
                        <IconComponent className="w-4 h-4" />
                      )}
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Campo de texto */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] resize-none"
          disabled={loading || isSubmitting}
        />
        
        {/* Dica de atalho */}
        <p className="text-xs text-muted-foreground">
          Pressione Ctrl+Enter para enviar
        </p>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-between">
        {/* Preview do tipo selecionado */}
        {showTypeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tipo:</span>
            <div className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              COMMENT_TYPE_CONFIG[type].color
            )}>
              {COMMENT_TYPE_CONFIG[type].icon && (() => {
                const IconComponent = COMMENT_TYPE_CONFIG[type].icon
                return <IconComponent className="w-3 h-3" />
              })()}
              {COMMENT_TYPE_CONFIG[type].label}
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            size="sm"
            disabled={isDisabled}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Enviando...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}