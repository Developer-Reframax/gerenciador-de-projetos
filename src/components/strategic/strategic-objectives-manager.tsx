'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Target } from 'lucide-react'
import { toast } from 'sonner'
import type { StrategicObjective, CreateStrategicObjectiveForm } from '@/types'

export function StrategicObjectivesManager() {
  const [objectives, setObjectives] = useState<StrategicObjective[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<StrategicObjective | null>(null)
  const [formData, setFormData] = useState<CreateStrategicObjectiveForm>({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadObjectives()
  }, [])

  const loadObjectives = async () => {
    try {
      const response = await fetch('/api/strategic-objectives')
      if (response.ok) {
        const data = await response.json()
        setObjectives(data.data)
      } else {
        toast.error('Erro ao carregar objetivos estratégicos')
      }
    } catch (error) {
      console.error('Erro ao carregar objetivos:', error)
      toast.error('Erro ao carregar objetivos estratégicos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingObjective 
        ? `/api/strategic-objectives?id=${editingObjective.id}`
        : '/api/strategic-objectives'
      
      const method = editingObjective ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingObjective ? 'Objetivo atualizado com sucesso' : 'Objetivo criado com sucesso')
        setIsCreateOpen(false)
        setEditingObjective(null)
        setFormData({ name: '', description: '' })
        await loadObjectives()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar objetivo')
      }
    } catch (error) {
      console.error('Erro ao salvar objetivo:', error)
      toast.error('Erro ao salvar objetivo')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (objective: StrategicObjective) => {
    setEditingObjective(objective)
    setFormData({
      name: objective.name,
      description: objective.description || ''
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo estratégico?')) {
      return
    }

    try {
      const response = await fetch(`/api/strategic-objectives?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Objetivo excluído com sucesso')
        await loadObjectives()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir objetivo')
      }
    } catch (error) {
      console.error('Erro ao excluir objetivo:', error)
      toast.error('Erro ao excluir objetivo')
    }
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingObjective(null)
    setFormData({ name: '', description: '' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos Estratégicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos Estratégicos
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingObjective ? 'Editar Objetivo Estratégico' : 'Novo Objetivo Estratégico'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do objetivo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do objetivo estratégico"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingObjective ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum objetivo estratégico cadastrado</p>
            <p className="text-sm">Clique em &quot;Novo Objetivo&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {objectives.map(objective => (
              <div key={objective.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{objective.name}</h3>
                  </div>
                  {objective.description && (
                    <p className="text-sm text-gray-600">{objective.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(objective)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(objective.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
