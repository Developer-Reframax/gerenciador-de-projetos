'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X, Loader2 } from 'lucide-react'
import { Area } from '@/types'

export interface AreasManagerProps {
  selectedAreaIds: string[]
  onSelectionChange: (areaIds: string[]) => void
}

export function AreasManager({ selectedAreaIds, onSelectionChange }: AreasManagerProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [newAreaDescription, setNewAreaDescription] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/areas')
      if (response.ok) {
        const data = await response.json()
        setAreas(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar áreas:', error)
    } finally {
      setLoading(false)
    }
  }

  const createArea = async () => {
    if (!newAreaName.trim()) return

    try {
      setCreating(true)
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAreaName.trim(),
          description: newAreaDescription.trim() || undefined,
          color: '#3B82F6'
        }),
      })

      if (response.ok) {
        const newArea = await response.json()
        setAreas(prev => [...prev, newArea.data])
        setNewAreaName('')
        setNewAreaDescription('')
        setShowCreateForm(false)
        // Adicionar automaticamente a nova área à seleção
        onSelectionChange([...selectedAreaIds, newArea.data.id])
      }
    } catch (error) {
      console.error('Erro ao criar área:', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleArea = (areaId: string) => {
    const newSelection = selectedAreaIds.includes(areaId)
      ? selectedAreaIds.filter(id => id !== areaId)
      : [...selectedAreaIds, areaId]
    onSelectionChange(newSelection)
  }

  const removeArea = (areaId: string) => {
    onSelectionChange(selectedAreaIds.filter(id => id !== areaId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando áreas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Áreas</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Área
        </Button>
      </div>

      {showCreateForm && (
        <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
          <div className="space-y-2">
            <Input
              placeholder="Nome da área"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
            />
            <Textarea
              placeholder="Descrição da área (opcional)"
              value={newAreaDescription}
              onChange={(e) => setNewAreaDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={createArea}
              disabled={creating || !newAreaName.trim()}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateForm(false)
                setNewAreaName('')
                setNewAreaDescription('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Áreas selecionadas */}
      {selectedAreaIds.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-gray-600">Áreas selecionadas:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedAreaIds.map(areaId => {
              const area = areas.find(a => a.id === areaId)
              return area ? (
                <Badge key={areaId} variant="secondary" className="flex items-center gap-1">
                  {area.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeArea(areaId)}
                  />
                </Badge>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Lista de áreas disponíveis */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-600">Áreas disponíveis:</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {areas.map(area => (
            <div
              key={area.id}
              className={`p-2 border rounded cursor-pointer transition-colors ${
                selectedAreaIds.includes(area.id)
                  ? 'bg-blue-50 border-blue-300'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleArea(area.id)}
            >
              <div className="text-sm font-medium">{area.name}</div>
              {area.description && (
                <div className="text-xs text-gray-500 truncate">{area.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
