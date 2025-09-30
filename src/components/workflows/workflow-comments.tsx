'use client'

import { useWorkflowComments } from '@/hooks/use-workflow-comments'
import { CommentList } from '../comments/comment-list'
import { useAuth } from '@/hooks/use-auth'
import { CommentType, Comment } from '@/types/comment'
import { WorkflowComment } from '@/types/workflow'

interface WorkflowCommentsProps {
  workflowId: string
}

// Função para converter WorkflowComment para Comment
const convertWorkflowCommentToComment = (workflowComment: WorkflowComment): Comment => {
  return {
    id: workflowComment.id,
    context: 'project' as const, // Workflows são tratados como projetos no contexto de comentários
    context_id: workflowComment.workflow_id,
    type: workflowComment.type,
    content: workflowComment.content,
    author_id: workflowComment.author_id,
    parent_id: workflowComment.parent_id || undefined,
    mentioned_users: workflowComment.mentioned_users,
    reactions: workflowComment.reactions,
    is_edited: workflowComment.is_edited,
    is_pinned: workflowComment.is_pinned,
    is_internal: workflowComment.is_internal,
    created_at: workflowComment.created_at,
    updated_at: workflowComment.updated_at,
    edited_at: workflowComment.edited_at || undefined,
    author: {
      id: workflowComment.author?.id || workflowComment.author_id,
      email: workflowComment.author?.email || '',
      user_metadata: {
        full_name: workflowComment.author?.full_name || undefined
      }
    },
    replies: workflowComment.replies?.map(convertWorkflowCommentToComment)
  }
}

export function WorkflowComments({ workflowId }: WorkflowCommentsProps) {
  const { user } = useAuth()
  const {
    comments: workflowComments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment
  } = useWorkflowComments(workflowId)

  // Converter WorkflowComment[] para Comment[]
  const comments: Comment[] = workflowComments.map(convertWorkflowCommentToComment)

  const handleCreateComment = async (content: string, parentId?: string, mentionedUsers?: string[], type: CommentType = 'comment') => {
    await createComment({
      content,
      type,
      parent_id: parentId || undefined,
      mentioned_users: mentionedUsers
    })
  }

  const handleUpdateComment = async (commentId: string, content: string, mentionedUsers?: string[]) => {
    await updateComment(commentId, { content, mentioned_users: mentionedUsers })
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId)
  }

  return (
    <CommentList
      comments={comments}
      loading={loading}
      error={error}
      onCreateComment={handleCreateComment}
      onUpdateComment={handleUpdateComment}
      onDeleteComment={handleDeleteComment}
      currentUserId={user?.id}
      projectId={workflowId} // Using workflowId as projectId for compatibility
      disableMentions={true} // Disable mentions for workflows
    />
  )
}