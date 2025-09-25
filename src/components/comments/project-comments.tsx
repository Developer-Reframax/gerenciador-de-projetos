'use client'

import { useComments } from '@/hooks/use-comments'
import { CommentList } from './comment-list'
import { useAuth } from '@/hooks/use-auth'
import { CommentType } from '@/types/comment'

interface ProjectCommentsProps {
  projectId: string
}

export function ProjectComments({ projectId }: ProjectCommentsProps) {
  const { user } = useAuth()
  const {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment
  } = useComments(projectId)

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
      projectId={projectId}
    />
  )
}
