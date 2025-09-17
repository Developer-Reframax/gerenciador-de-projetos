'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { StrategicPillar, CreateStrategicPillarForm } from '@/types'

export function StrategicPillarsManager() {
  const [pillars, setPillars] = useState<StrategicPillar[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPillar, setEditingPillar] = useState<StrategicPillar | null>(null)
  const [formData, setFormData] = useState<CreateStrategicPillarForm>({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPillars()
  }, [])

  const loadPillars = async () => {
    try {
      const response = await fetch('/api/strategic-pillars')
      if (response.ok) {
        const data = await response.json()
        setPillars(data.data)
      } else {
        toast.error('Erro ao carregar pilares estratégicos')
      }
    } catch (error) {
      console.error('Erro ao carregar pilares:', error)
      toast.error('Erro ao carregar pilares estratégicos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingPillar 
        ? `/api/strategic-pillars?id=${editingPillar.id}`
        : '/api/strategic-pillars'
      
      const method = editingPillar ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingPillar ? 'Pilar atualizado com sucesso' : 'Pilar criado com sucesso')
        setIsCreateOpen(false)
        setEditingPillar(null)
        setFormData({ name: '', description: '' })
        await loadPillars()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar pilar')
      }
    } catch (error) {
      console.error('Erro ao salvar pilar:', error)
      toast.error('Erro ao salvar pilar')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (pillar: StrategicPillar) => {
    setEditingPillar(pillar)
    setFormData({
      name: pillar.name,
      description: pillar.description || ''
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pilar estratégico?')) {
      return
    }

    try {
      const response = await fetch(`/api/strategic-pillars?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Pilar excluído com sucesso')
        await loadPillars()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir pilar')
      }
    } catch (error) {
      console.error('Erro ao excluir pilar:', error)
      toast.error('Erro ao excluir pilar')
    }
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingPillar(null)
    setFormData({ name: '', description: '' })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Pilares Estratégicos
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
            <Building2 className="h-5 w-5" />
            Pilares Estratégicos
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pilar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPillar ? 'Editar Pilar Estratégico' : 'Novo Pilar Estratégico'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome do pilar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do pilar estratégico"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingPillar ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pillars.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pilar estratégico cadastrado</p>
            <p className="text-sm">Clique em &quot;Novo Pilar&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pillars.map(pillar => (
              <div key={pillar.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{pillar.name}</h3>
                  </div>
                  {pillar.description && (
                    <p className="text-sm text-gray-600">{pillar.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pillar)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pillar.id)}
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