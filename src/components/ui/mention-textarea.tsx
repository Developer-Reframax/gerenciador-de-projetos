'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useProjectMembers } from '@/hooks/use-project-members'

interface ProjectMember {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
}



interface MentionTextareaProps {
  value: string
  onChange: (value: string, mentionedUsers: string[]) => void
  placeholder?: string
  projectId: string
  className?: string
  disabled?: boolean
  rows?: number
}

interface SuggestionPosition {
  top: number
  left: number
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  projectId,
  className,
  disabled,
  rows = 3
}: MentionTextareaProps) {
  const [filteredUsers, setFilteredUsers] = useState<ProjectMember[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition>({ top: 0, left: 0 })
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Use the project members hook instead of direct API call
  const { members: users = [], loading } = useProjectMembers(projectId)

  // Debug logs
  useEffect(() => {
    console.log('[MentionTextarea] Component mounted/updated');
    console.log('[MentionTextarea] projectId:', projectId);
    console.log('[MentionTextarea] members:', users);
    console.log('[MentionTextarea] loading:', loading);
  }, [projectId, users, loading]);

  // Extract mentioned users from text
  const extractMentionedUsers = useCallback((text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]) // Extract user ID from @[Name](userId)
    }
    
    return mentions
  }, [])

  // Get caret position for suggestions
  const getCaretPosition = useCallback(() => {
    if (!textareaRef.current) return { top: 0, left: 0 }
    
    const textarea = textareaRef.current
    const { selectionStart } = textarea
    
    // Create a temporary div to measure text position
    const div = document.createElement('div')
    const style = window.getComputedStyle(textarea)
    
    // Copy textarea styles to div
    div.style.position = 'absolute'
    div.style.visibility = 'hidden'
    div.style.whiteSpace = 'pre-wrap'
    div.style.wordWrap = 'break-word'
    div.style.font = style.font
    div.style.padding = style.padding
    div.style.border = style.border
    div.style.width = style.width
    div.style.height = style.height
    
    document.body.appendChild(div)
    
    // Get text before caret
    const textBeforeCaret = textarea.value.substring(0, selectionStart)
    div.textContent = textBeforeCaret
    
    // Create span for caret position
    const span = document.createElement('span')
    span.textContent = '|'
    div.appendChild(span)
    
    const rect = textarea.getBoundingClientRect()
    const spanRect = span.getBoundingClientRect()
    
    document.body.removeChild(div)
    
    return {
      top: spanRect.top - rect.top + textarea.scrollTop + 20,
      left: spanRect.left - rect.left
    }
  }, [])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    console.log('[MentionTextarea] Input changed:', newValue);
    console.log('[MentionTextarea] Cursor position:', cursorPosition);
    console.log('[MentionTextarea] Available users:', users);
    
    // Check for @ mention
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@([^@\s]*)$/)
    
    console.log('[MentionTextarea] Text before cursor:', textBeforeCursor);
    console.log('[MentionTextarea] Mention match:', mentionMatch);
    
    if (mentionMatch && users.length > 0) {
      const query = mentionMatch[1]
      const start = cursorPosition - query.length - 1
      
      console.log('[MentionTextarea] Mention detected - start:', start, 'query:', query);
      
      setMentionQuery(query)
      setMentionStart(start)
      
      // Filter users based on query - show all users if query is empty
      const filtered = query === '' ? users : users.filter(user => 
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      )
      
      console.log('[MentionTextarea] Filtered users:', filtered);
      
      setFilteredUsers(filtered)
      setShowSuggestions(filtered.length > 0)
      setSelectedIndex(0)
      
      console.log('[MentionTextarea] showSuggestions set to:', filtered.length > 0);
      
      // Update suggestion position
      setTimeout(() => {
        const position = getCaretPosition()
        setSuggestionPosition(position)
        console.log('[MentionTextarea] Suggestion position:', position);
      }, 0)
    } else {
      console.log('[MentionTextarea] No mention detected or no users available');
      console.log('[MentionTextarea] Users length:', users.length);
      setShowSuggestions(false)
      setMentionQuery('')
      setMentionStart(-1)
      setFilteredUsers([])
    }
    
    // Extract mentioned users and call onChange
    const mentionedUsers = extractMentionedUsers(newValue)
    onChange(newValue, mentionedUsers)
  }

  // Handle mention selection
  const selectMention = (member: ProjectMember) => {
    if (mentionStart === -1) return
    
    const beforeMention = value.substring(0, mentionStart)
    const afterMention = value.substring(mentionStart + mentionQuery.length + 1)
    const mentionText = `@[${member.name || member.email}](${member.id})`
    
    const newValue = beforeMention + mentionText + afterMention
    const mentionedUsers = extractMentionedUsers(newValue)
    
    onChange(newValue, mentionedUsers)
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + mentionText.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        selectMention(filteredUsers[selectedIndex])
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debug render
  console.log('[MentionTextarea] Rendering - showSuggestions:', showSuggestions, 'filteredUsers.length:', filteredUsers.length);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        rows={rows}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left
          }}
          onMouseDown={(e) => {
            // Prevent textarea from losing focus when clicking suggestions
            e.preventDefault()
          }}
        >
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100",
                index === selectedIndex && "bg-blue-50 border-l-2 border-blue-500"
              )}
              onClick={() => selectMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                <AvatarFallback className="text-xs">
                  {(user.name || user.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {user.role || 'Membro'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}