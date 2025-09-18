'use client'

import { useState } from 'react'
import { Comment, COMMENT_TYPE_CONFIG } from '@/types/comment'
import { CommentForm } from './comment-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreHorizontal, Edit, Trash2, Reply, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentItemProps {
  comment: Comment
  onUpdate: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
  onReply?: () => void
  currentUserId?: string
  showReplyButton?: boolean
  isReply?: boolean
}

export function CommentItem({
  comment,
  onUpdate,
  onDelete,
  onReply,
  currentUserId,
  showReplyButton = true,
  isReply = false
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLiked, setIsLiked] = useState(false) // TODO: Implementar sistema de likes
  const [likesCount, setLikesCount] = useState(0) // TODO: Buscar do banco

  const isAuthor = currentUserId === comment.author_id
  const typeConfig = COMMENT_TYPE_CONFIG[comment.type]

  const handleUpdate = async (content: string) => {
    await onUpdate(comment.id, content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await onDelete(comment.id)
    setShowDeleteDialog(false)
  }

  const handleLike = () => {
    // TODO: Implementar sistema de likes/reactions
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ptBR
    })
  }

  if (isEditing) {
    return (
      <div className={cn(
        "border rounded-lg p-4",
        isReply && "bg-muted/30"
      )}>
        <CommentForm
          initialValue={comment.content}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
          placeholder="Edite seu comentário..."
          submitLabel="Salvar"
        />
      </div>
    )
  }

  return (
    <>
      <div className={cn(
        "border rounded-lg p-4 space-y-3",
        isReply && "bg-muted/30"
      )}>
        {/* Header do comentário */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.author.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">
                {getInitials(
                  comment.author.user_metadata?.full_name || 
                  comment.author.email?.split('@')[0] || 
                  'U'
                )}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author.user_metadata?.full_name || comment.author.email}
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    typeConfig.color
                  )}
                >
                  {typeConfig.icon && <typeConfig.icon className="w-3 h-3 mr-1" />}
                  {typeConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(comment.created_at)}</span>
                {comment.edited_at && comment.edited_at !== comment.created_at && (
                  <span className="italic">(editado)</span>
                )}
              </div>
            </div>
          </div>

          {/* Menu de ações */}
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Conteúdo do comentário */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </div>

        {/* Ações do comentário */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "h-8 px-2 text-xs",
              isLiked && "text-red-500"
            )}
          >
            <Heart className={cn(
              "w-4 h-4 mr-1",
              isLiked && "fill-current"
            )} />
            {likesCount > 0 && likesCount}
          </Button>
          
          {showReplyButton && onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReply}
              className="h-8 px-2 text-xs"
            >
              <Reply className="w-4 h-4 mr-1" />
              Responder
            </Button>
          )}
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
