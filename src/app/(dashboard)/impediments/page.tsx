'use client'

import { useState } from 'react'
import { Search, Filter, Edit, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGlobalImpediments } from '@/hooks/use-global-impediments'
import { useAuth } from '@/contexts/auth-context'
import { ImpedimentForm } from '@/components/work-items/impediment-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GlobalImpediment } from '@/types'

const IMPEDIMENT_STATUS_LABELS = {
  aberto: 'Aberto',
  em_resolucao: 'Em Resolução',
  resolvido: 'Resolvido',
  cancelado: 'Cancelado'
}

const IMPEDIMENT_CRITICALITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica'
}

function getImpedimentStatusColor(status: string) {
  switch (status) {
    case 'aberto': return 'bg-red-100 text-red-800'
    case 'em_resolucao': return 'bg-yellow-100 text-yellow-800'
    case 'resolvido': return 'bg-green-100 text-green-800'
    case 'cancelado': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getImpedimentCriticalityColor(criticality: string) {
  switch (criticality) {
    case 'critica': return 'bg-red-100 text-red-800'
    case 'alta': return 'bg-orange-100 text-orange-800'
    case 'media': return 'bg-yellow-100 text-yellow-800'
    case 'baixa': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function ImpedimentsPage() {
  const { user } = useAuth()
  const { impediments, loading, error, refetch, deleteImpediment } = useGlobalImpediments()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [editingImpediment, setEditingImpediment] = useState<GlobalImpediment | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Filtrar impedimentos
  const filteredImpediments = impediments.filter((impediment) => {
    const matchesSearch = impediment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         impediment.stage?.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         impediment.stage?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || impediment.status === statusFilter
    const matchesCriticality = severityFilter === 'all' || impediment.criticality === severityFilter
    
    return matchesSearch && matchesStatus && matchesCriticality
  })

  const handleEditImpediment = (impediment: GlobalImpediment) => {
    setEditingImpediment(impediment)
    setEditModalOpen(true)
  }

  const handleDeleteImpediment = async (impediment: GlobalImpediment) => {
    if (!confirm('Tem certeza que deseja excluir este impedimento?')) return
    
    try {
      await deleteImpediment(impediment.id, impediment.stage?.project?.id || '')
      toast.success('Impedimento excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir impedimento')
      console.error('Erro ao excluir impedimento:', error)
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setEditingImpediment(null)
  }

  const handleImpedimentUpdated = async () => {
    refetch()
    handleCloseEditModal()
    toast.success('Impedimento atualizado com sucesso!')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você precisa estar logado para ver os impedimentos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            Impedimentos
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os impedimentos dos seus projetos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar impedimentos, projetos ou etapas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(IMPEDIMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Severidade */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Severidades</SelectItem>
                {Object.entries(IMPEDIMENT_CRITICALITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Impedimentos */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Erro ao carregar impedimentos: {error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredImpediments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {impediments.length === 0 ? (
                <div>
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Nenhum impedimento encontrado</p>
                  <p>Os impedimentos dos seus projetos aparecerão aqui.</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Nenhum impedimento encontrado</p>
                  <p>Tente ajustar os filtros de busca.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredImpediments.map((impediment) => (
            <Card key={impediment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{impediment.description}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{impediment.stage?.project?.name}</span>
                      <span>•</span>
                      <span>{impediment.stage?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditImpediment(impediment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteImpediment(impediment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status e Severidade */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getImpedimentStatusColor(impediment.status)}>
                      {IMPEDIMENT_STATUS_LABELS[impediment.status as keyof typeof IMPEDIMENT_STATUS_LABELS]}
                    </Badge>
                    <Badge className={getImpedimentCriticalityColor(impediment.criticality)}>
                      Criticidade {IMPEDIMENT_CRITICALITY_LABELS[impediment.criticality as keyof typeof IMPEDIMENT_CRITICALITY_LABELS]}
                    </Badge>
                  </div>

                  {/* Plano de resolução não existe no banco de dados */}

                  {/* Datas e Responsável */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {impediment.identification_date && (
                      <div>
                        <p className="font-medium">Data de Identificação:</p>
                        <p className="text-muted-foreground">
                          {format(new Date(impediment.identification_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    {impediment.expected_resolution_date && (
                      <div>
                        <p className="font-medium">Resolução Esperada:</p>
                        <p className="text-muted-foreground">
                          {format(new Date(impediment.expected_resolution_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    {impediment.expected_resolution_date && (
                      <div>
                        <p className="font-medium">Data de Resolução Esperada:</p>
                        <p className="text-muted-foreground">
                          {format(new Date(impediment.expected_resolution_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    {impediment.responsible_user && (
                      <div>
                        <p className="font-medium">Responsável:</p>
                        <p className="text-muted-foreground">
                          {impediment.responsible_user.full_name || impediment.responsible_user.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={handleCloseEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Impedimento</DialogTitle>
          </DialogHeader>
          {editingImpediment && (
            <ImpedimentForm
              impediment={editingImpediment}
              stages={editingImpediment.stage ? [editingImpediment.stage] : []}
              onSubmit={handleImpedimentUpdated}
              onCancel={handleCloseEditModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}