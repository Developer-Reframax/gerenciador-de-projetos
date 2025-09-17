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

export interface Area {
  id: string
  name: string
  description?: string
  color: string
  created_at?: string
  updated_at?: string
}

export interface CreateAreaForm {
  name: string
  description?: string
  color: string
}

interface AreasManagerProps {
  onAreaCreated?: (area: Area) => void
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
]

export function AreasManager({ onAreaCreated }: AreasManagerProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [formData, setFormData] = useState<CreateAreaForm>({ 
    name: '', 
    description: '', 
    color: DEFAULT_COLORS[0] 
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = async () => {
    try {
      const response = await fetch('/api/areas')
      if (response.ok) {
        const data = await response.json()
        setAreas(data.data)
      } else {
        toast.error('Erro ao carregar áreas')
      }
    } catch (error) {
      console.error('Erro ao carregar áreas:', error)
      toast.error('Erro ao carregar áreas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingArea 
        ? `/api/areas?id=${editingArea.id}`
        : '/api/areas'
      
      const method = editingArea ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(editingArea ? 'Área atualizada com sucesso' : 'Área criada com sucesso')
        setIsCreateOpen(false)
        setEditingArea(null)
        setFormData({ name: '', description: '', color: DEFAULT_COLORS[0] })
        await loadAreas()
        
        // Notificar componente pai sobre nova área criada
        if (!editingArea && onAreaCreated && result.data) {
          onAreaCreated(result.data)
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar área')
      }
    } catch (error) {
      console.error('Erro ao salvar área:', error)
      toast.error('Erro ao salvar área')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setFormData({
      name: area.name,
      description: area.description || '',
      color: area.color
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta área?')) {
      return
    }

    try {
      const response = await fetch(`/api/areas?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Área excluída com sucesso')
        await loadAreas()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir área')
      }
    } catch (error) {
      console.error('Erro ao excluir área:', error)
      toast.error('Erro ao excluir área')
    }
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingArea(null)
    setFormData({ name: '', description: '', color: DEFAULT_COLORS[0] })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Áreas Organizacionais
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
            Áreas Organizacionais
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingArea ? 'Editar Área' : 'Nova Área'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome da área"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da área organizacional"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2 mt-2">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingArea ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {areas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma área cadastrada</p>
            <p className="text-sm">Clique em &quot;Nova Área&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {areas.map(area => (
              <div key={area.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: area.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{area.name}</h3>
                    {area.description && (
                      <p className="text-sm text-gray-600">{area.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(area.id)}
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