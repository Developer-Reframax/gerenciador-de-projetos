'use client'

import React, { useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface WorkflowMentionTextareaProps {
  value: string
  onChange: (value: string, mentionedUsers: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  rows?: number
}

/**
 * Simplified textarea component for workflows that doesn't support mentions.
 * This removes the dependency on project members API for workflow comments.
 */
export function WorkflowMentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  rows = 3
}: WorkflowMentionTextareaProps) {
  // Extract mentioned users from text (for compatibility, but workflows don't use mentions)
  const extractMentionedUsers = useCallback((text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]) // Extract user ID from @[Name](userId)
    }
    
    return mentions
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    
    // Extract mentioned users and call onChange (empty array for workflows)
    const mentionedUsers = extractMentionedUsers(newValue)
    onChange(newValue, mentionedUsers)
  }

  return (
    <Textarea
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      rows={rows}
    />
  )
}