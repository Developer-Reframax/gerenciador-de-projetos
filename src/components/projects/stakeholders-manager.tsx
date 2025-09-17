'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, X, Loader2 } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  role?: string
}

export interface StakeholdersManagerProps {
  selectedStakeholderIds: string[]
  onSelectionChange: (stakeholderIds: string[]) => void
}

export function StakeholdersManager({ selectedStakeholderIds, onSelectionChange }: StakeholdersManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [users, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stakeholders')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStakeholder = (userId: string) => {
    const newSelection = selectedStakeholderIds.includes(userId)
      ? selectedStakeholderIds.filter(id => id !== userId)
      : [...selectedStakeholderIds, userId]
    onSelectionChange(newSelection)
  }

  const removeStakeholder = (userId: string) => {
    onSelectionChange(selectedStakeholderIds.filter(id => id !== userId))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Stakeholders</Label>
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stakeholders selecionados */}
      {selectedStakeholderIds.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Stakeholders selecionados:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedStakeholderIds.map(userId => {
              const user = users.find(u => u.id === userId)
              return user ? (
                <Badge key={userId} variant="secondary" className="flex items-center gap-2 py-1 px-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{user.full_name}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeStakeholder(userId)}
                  />
                </Badge>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Lista de usuários disponíveis */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Usuários disponíveis:</Label>
        <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className={`p-3 cursor-pointer transition-colors border-b last:border-b-0 ${
                  selectedStakeholderIds.includes(user.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleStakeholder(user.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    {user.role && (
                      <div className="text-xs text-gray-400">{user.role}</div>
                    )}
                  </div>
                  {selectedStakeholderIds.includes(user.id) && (
                    <div className="text-blue-600 text-sm font-medium">✓</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}