'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Users, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Stakeholder } from '@/types'

interface User {
  id: string
  name: string
  email: string
  role?: string
}

interface StakeholdersManagerProps {
  projectId: string
  selectedStakeholders: Stakeholder[]
  onStakeholdersChange: (stakeholders: Stakeholder[]) => void
}

export function StakeholdersManager({ 
  projectId, 
  selectedStakeholders, 
  onStakeholdersChange 
}: StakeholdersManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tempSelectedUsers, setTempSelectedUsers] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isSelectOpen) {
      loadUsers()
      // Inicializar seleção temporária com stakeholders atuais
      setTempSelectedUsers(selectedStakeholders.map(s => s.user_id))
    }
  }, [isSelectOpen, selectedStakeholders])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      } else {
        toast.error('Erro ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleUserToggle = (userId: string) => {
    setTempSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSaveSelection = async () => {
    setSaving(true)
    try {
      // Converter IDs selecionados em objetos Stakeholder
      const newStakeholders: Stakeholder[] = tempSelectedUsers.map(userId => {
        const user = users.find(u => u.id === userId)
        return {
          id: `${projectId}-${userId}`, // ID temporário
          user_id: userId,
          user_name: user?.name || '',
          user_email: user?.email || '',
          role: user?.role
        }
      })

      // Salvar no backend
      const response = await fetch(`/api/projects/${projectId}/stakeholders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stakeholder_ids: tempSelectedUsers })
      })

      if (response.ok) {
        const result = await response.json()
        onStakeholdersChange(result.data || newStakeholders)
        toast.success('Stakeholders atualizados com sucesso')
        setIsSelectOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar stakeholders')
      }
    } catch (error) {
      console.error('Erro ao salvar stakeholders:', error)
      toast.error('Erro ao salvar stakeholders')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveStakeholder = async (stakeholderId: string) => {
    try {
      const updatedStakeholders = selectedStakeholders.filter(s => s.id !== stakeholderId)
      const userIds = updatedStakeholders.map(s => s.user_id)
      
      const response = await fetch(`/api/projects/${projectId}/stakeholders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stakeholder_ids: userIds })
      })

      if (response.ok) {
        onStakeholdersChange(updatedStakeholders)
        toast.success('Stakeholder removido com sucesso')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao remover stakeholder')
      }
    } catch (error) {
      console.error('Erro ao remover stakeholder:', error)
      toast.error('Erro ao remover stakeholder')
    }
  }

  const handleCloseDialog = () => {
    setIsSelectOpen(false)
    setSearchTerm('')
    setTempSelectedUsers(selectedStakeholders.map(s => s.user_id))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Stakeholders
          </CardTitle>
          <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Gerenciar Stakeholders
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Selecionar Stakeholders</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum usuário encontrado</p>
                      </div>
                    ) : (
                      filteredUsers.map(user => (
                        <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={user.id}
                            checked={tempSelectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={user.id} className="cursor-pointer">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                              {user.role && (
                                <div className="text-xs text-gray-500">{user.role}</div>
                              )}
                            </Label>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {tempSelectedUsers.length} usuário(s) selecionado(s)
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveSelection} disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar Seleção'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {selectedStakeholders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum stakeholder selecionado</p>
            <p className="text-sm">Clique em &quot;Gerenciar Stakeholders&quot; para adicionar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedStakeholders.map(stakeholder => (
              <div key={stakeholder.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{stakeholder.user_name}</div>
                  <div className="text-sm text-gray-600">{stakeholder.user_email}</div>
                  {stakeholder.role && (
                    <div className="text-xs text-gray-500">{stakeholder.role}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveStakeholder(stakeholder.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}