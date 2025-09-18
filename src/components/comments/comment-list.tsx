'use client'

import { useState } from 'react'
import { Comment } from '@/types/comment'
import { CommentItem } from './comment-item'
import { CommentForm } from './comment-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CommentListProps {
  comments: Comment[]
  loading: boolean
  error: string | null
  onCreateComment: (content: string, parentId?: string) => Promise<void>
  onUpdateComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  currentUserId?: string
}

export function CommentList({
  comments,
  loading,
  error,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  currentUserId
}: CommentListProps) {
  const [showForm, setShowForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const handleCreateComment = async (content: string, parentId?: string) => {
    await onCreateComment(content, parentId)
    setShowForm(false)
    setReplyingTo(null)
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    setShowForm(false)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comentários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
              <Skeleton className="w-full h-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comentários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comentários ({comments.length})
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancelar' : 'Novo Comentário'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para novo comentário */}
        {showForm && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <CommentForm
              onSubmit={(content) => handleCreateComment(content)}
              onCancel={() => setShowForm(false)}
              placeholder="Escreva seu comentário..."
              submitLabel="Comentar"
            />
          </div>
        )}

        {/* Lista de comentários */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum comentário ainda</p>
            <p className="text-sm">
              Seja o primeiro a comentar neste projeto!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <CommentItem
                  comment={comment}
                  onUpdate={onUpdateComment}
                  onDelete={onDeleteComment}
                  onReply={() => handleReply(comment.id)}
                  currentUserId={currentUserId}
                  showReplyButton={true}
                />
                
                {/* Formulário de resposta */}
                {replyingTo === comment.id && (
                  <div className="ml-8 border rounded-lg p-4 bg-muted/30">
                    <CommentForm
                      onSubmit={(content) => handleCreateComment(content, comment.id)}
                      onCancel={handleCancelReply}
                      placeholder={`Respondendo a ${comment.author.user_metadata.full_name || comment.author.email}...`}
                      submitLabel="Responder"
                    />
                  </div>
                )}
                
                {/* Respostas */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onUpdate={onUpdateComment}
                        onDelete={onDeleteComment}
                        onReply={() => handleReply(comment.id)} // Responder ao comentário pai
                        currentUserId={currentUserId}
                        showReplyButton={false}
                        isReply={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
