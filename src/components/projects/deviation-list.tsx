'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  Calendar,
  Edit,
  Filter,
  Plus,
  Search,
  Trash2,
  User
} from 'lucide-react'
import { DeviationModal } from './deviation-modal'
import type { ProjectDeviationWithUsers, DeviationStatus } from '@/types/database'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DeviationListProps {
  projectId: string
  deviations: ProjectDeviationWithUsers[]
  onRefresh: () => void
}

const STATUS_COLORS: Record<DeviationStatus, string> = {
  'Pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Em análise': 'bg-blue-100 text-blue-800 border-blue-200',
  'Aprovado': 'bg-green-100 text-green-800 border-green-200',
  'Rejeitado': 'bg-red-100 text-red-800 border-red-200',
  'Implementado': 'bg-purple-100 text-purple-800 border-purple-200'
}

export function DeviationList({ projectId, deviations, onRefresh }: DeviationListProps) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingDeviation, setEditingDeviation] = React.useState<ProjectDeviationWithUsers | undefined>()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const [loading, setLoading] = React.useState(false)

  // Filtrar desvios
  const filteredDeviations = React.useMemo(() => {
    return deviations.filter(deviation => {
      const matchesSearch = 
        deviation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deviation.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || deviation.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [deviations, searchTerm, statusFilter])

  const handleCreateDeviation = () => {
    setEditingDeviation(undefined)
    setModalOpen(true)
  }

  const handleEditDeviation = (deviation: ProjectDeviationWithUsers) => {
    setEditingDeviation(deviation)
    setModalOpen(true)
  }

  const handleDeleteDeviation = async (deviationId: string) => {
    if (!confirm('Tem certeza que deseja excluir este desvio?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/deviations/${deviationId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir desvio')
      }

      toast.success('Desvio excluído com sucesso!')
      onRefresh()
    } catch (error) {
      console.error('Erro ao excluir desvio:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir desvio')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definida'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Busca */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar desvios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em análise">Em análise</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                <SelectItem value="Implementado">Implementado</SelectItem>
              </SelectContent>
            </Select>


          </div>
        </div>

        {/* Botão criar */}
        <Button onClick={handleCreateDeviation}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Desvio
        </Button>
      </div>

      {/* Lista de desvios */}
      <div className="space-y-4">
        {filteredDeviations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                {deviations.length === 0 
                  ? 'Nenhum desvio registrado ainda.'
                  : 'Nenhum desvio encontrado com os filtros aplicados.'
                }
              </p>
              {deviations.length === 0 && (
                <Button onClick={handleCreateDeviation} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro desvio
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDeviations.map((deviation) => (
            <Card 
              key={deviation.id} 
              className="transition-all hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{deviation.description}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <Badge 
                        variant="outline" 
                        className={STATUS_COLORS[deviation.status as DeviationStatus]}
                      >
                        {deviation.status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {deviation.requested_by_user?.full_name || 'Usuário não encontrado'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(deviation.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDeviation(deviation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDeviation(deviation.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{deviation.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Critério:</span>
                    <p>{deviation.evaluation_criteria}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Impacto:</span>
                    <p>{deviation.impact_type}</p>
                  </div>
                  {deviation.approved_at && (
                    <div>
                      <span className="font-medium text-gray-600">Data de Aprovação:</span>
                      <p>{formatDate(deviation.approved_at)}</p>
                    </div>
                  )}
                  {deviation.updated_at && (
                    <div>
                      <span className="font-medium text-gray-600">Data de Implementação:</span>
                      <p>{formatDate(deviation.updated_at)}</p>
                    </div>
                  )}
                  {deviation.approver_user && (
                    <div>
                      <span className="font-medium text-gray-600">Aprovador:</span>
                      <p>{deviation.approver_user.full_name || deviation.approver_user.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <DeviationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        deviation={editingDeviation}
        mode={editingDeviation ? 'edit' : 'create'}
        onSuccess={onRefresh}
      />
    </div>
  )
}
