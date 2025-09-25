'use client'

import { useState } from 'react'
import { Search, Filter, Edit, Trash2, AlertTriangle } from 'lucide-react'
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
import { useGlobalRisks } from '@/hooks/use-global-risks'
import { useAuth } from '@/contexts/auth-context'
import { RiskForm } from '@/components/work-items/risk-form'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GlobalRisk } from '@/types'

const RISK_STATUS_LABELS = {
  identificado: 'Identificado',
  em_analise: 'Em Análise',
  em_mitigacao: 'Em Mitigação',
  monitorado: 'Monitorado',
  materializado: 'Materializado',
  encerrado: 'Encerrado'
}

const RISK_PROBABILITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
}

const RISK_IMPACT_LABELS = {
  prazo: 'Prazo',
  custo: 'Custo',
  qualidade: 'Qualidade',
  reputacao: 'Reputação'
}

function getRiskStatusColor(status: string) {
  switch (status) {
    case 'identificado': return 'bg-yellow-100 text-yellow-800'
    case 'em_analise': return 'bg-blue-100 text-blue-800'
    case 'em_mitigacao': return 'bg-orange-100 text-orange-800'
    case 'monitorado': return 'bg-purple-100 text-purple-800'
    case 'materializado': return 'bg-red-100 text-red-800'
    case 'encerrado': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getRiskPriorityColor(probability: string) {
  // Simplificado: alta probabilidade = alto risco
  if (probability === 'alta') return 'bg-red-100 text-red-800'
  if (probability === 'media') return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export default function RisksPage() {
  const { user } = useAuth()
  const { risks, loading, error, refetch, deleteRisk } = useGlobalRisks()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [probabilityFilter, setProbabilityFilter] = useState<string>('all')
  const [editingRisk, setEditingRisk] = useState<GlobalRisk | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Filtrar riscos
  const filteredRisks = risks.filter((risk) => {
    const matchesSearch = (risk.name?.toLowerCase().includes(searchTerm.toLowerCase()) || risk.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         risk.stage?.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.stage?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || risk.status === statusFilter
    const matchesProbability = probabilityFilter === 'all' || risk.probability === probabilityFilter
    
    return matchesSearch && matchesStatus && matchesProbability
  })

  const handleEditRisk = (risk: GlobalRisk) => {
    setEditingRisk(risk)
    setEditModalOpen(true)
  }

  const handleDeleteRisk = async (risk: GlobalRisk) => {
    if (!confirm('Tem certeza que deseja excluir este risco?')) return
    
    try {
      await deleteRisk(risk.id, risk.stage?.project?.id || '')
      toast.success('Risco excluído com sucesso!')
    } catch (error) {
      toast.error('Erro ao excluir risco')
      console.error('Erro ao excluir risco:', error)
    }
  }

  const handleCloseEditModal = () => {
    setEditModalOpen(false)
    setEditingRisk(null)
  }

  const handleRiskUpdated = async () => {
    refetch()
    handleCloseEditModal()
    toast.success('Risco atualizado com sucesso!')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você precisa estar logado para ver os riscos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            Riscos
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os riscos dos seus projetos
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
                placeholder="Buscar riscos, projetos ou etapas..."
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
                {Object.entries(RISK_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Probabilidade */}
            <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Probabilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Probabilidades</SelectItem>
                {Object.entries(RISK_PROBABILITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Riscos */}
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
              <p>Erro ao carregar riscos: {error}</p>
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
      ) : filteredRisks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {risks.length === 0 ? (
                <div>
                  <AlertTriangle className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Nenhum risco encontrado</p>
                  <p>Os riscos dos seus projetos aparecerão aqui.</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Nenhum risco encontrado</p>
                  <p>Tente ajustar os filtros de busca.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRisks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{risk.name || risk.description}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">{risk.stage?.project?.name}</span>
                      <span>•</span>
                      <span>{risk.stage?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRisk(risk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRisk(risk)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status e Prioridade */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getRiskStatusColor(risk.status)}>
                      {RISK_STATUS_LABELS[risk.status as keyof typeof RISK_STATUS_LABELS]}
                    </Badge>
                    <Badge className={getRiskPriorityColor(risk.probability)}>
                      {RISK_PROBABILITY_LABELS[risk.probability as keyof typeof RISK_PROBABILITY_LABELS]} Probabilidade
                    </Badge>
                    <Badge variant="outline">
                      {RISK_IMPACT_LABELS[risk.impact as keyof typeof RISK_IMPACT_LABELS]} Impacto
                    </Badge>
                  </div>

                  {/* Planos de mitigação e contingência não existem no banco de dados */}

                  {/* Datas e Responsável */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {risk.identification_date && (
                      <div>
                        <p className="font-medium">Data de Identificação:</p>
                        <p className="text-muted-foreground">
                          {format(new Date(risk.identification_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    {risk.expected_resolution_date && (
                      <div>
                        <p className="font-medium">Resolução Esperada:</p>
                        <p className="text-muted-foreground">
                          {format(new Date(risk.expected_resolution_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    
                    {risk.responsible_user && (
                      <div>
                        <p className="font-medium">Responsável:</p>
                        <p className="text-muted-foreground">
                          {risk.responsible_user.full_name || risk.responsible_user.email}
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
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Risco</DialogTitle>
          </DialogHeader>
          {editingRisk && (
            <RiskForm
              risk={editingRisk}
              stages={editingRisk.stage ? [editingRisk.stage] : []}
              onSubmit={handleRiskUpdated}
              onCancel={handleCloseEditModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}