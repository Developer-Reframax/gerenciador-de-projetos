'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { Tag as TagType, CreateTagForm } from '@/types'

export function TagsManager() {
  const [tags, setTags] = useState<TagType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)
  const [formData, setFormData] = useState<CreateTagForm>({ name: '', color: '#3b82f6' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.data)
      } else {
        toast.error('Erro ao carregar tags')
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
      toast.error('Erro ao carregar tags')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingTag 
        ? `/api/tags?id=${editingTag.id}`
        : '/api/tags'
      
      const method = editingTag ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingTag ? 'Tag atualizada com sucesso' : 'Tag criada com sucesso')
        setIsCreateOpen(false)
        setEditingTag(null)
        setFormData({ name: '', color: '#3b82f6' })
        await loadTags()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar tag')
      }
    } catch (error) {
      console.error('Erro ao salvar tag:', error)
      toast.error('Erro ao salvar tag')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color || '#3b82f6'
    })
    setIsCreateOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tag?')) {
      return
    }

    try {
      const response = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Tag excluída com sucesso')
        await loadTags()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir tag')
      }
    } catch (error) {
      console.error('Erro ao excluir tag:', error)
      toast.error('Erro ao excluir tag')
    }
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingTag(null)
    setFormData({ name: '', color: '#3b82f6' })
  }

  const predefinedColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#ec4899', // pink
    '#6b7280'  // gray
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
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
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? 'Editar Tag' : 'Nova Tag'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome da tag"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Cor</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {predefinedColors.map(color => (
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
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20 h-10"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingTag ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tag cadastrada</p>
            <p className="text-sm">Clique em &quot;Nova Tag&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  />
                  <div>
                    <h3 className="font-medium">{tag.name}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(tag.id)}
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