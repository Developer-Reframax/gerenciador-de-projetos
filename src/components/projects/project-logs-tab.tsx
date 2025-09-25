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
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Filter,
  History,
  Search,
  User,
  FileText,
  RefreshCw
} from 'lucide-react'
import { useProjectLogs, useProjectLogsFilters, useProjectLogsFilterOptions } from '@/hooks/use-project-logs'
import type { ProjectLog } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface ProjectLogsTabProps {
  projectId: string
}

const ACTION_COLORS: Record<string, string> = {
  'INSERT': 'bg-green-100 text-green-800 border-green-200',
  'UPDATE': 'bg-blue-100 text-blue-800 border-blue-200',
  'DELETE': 'bg-red-100 text-red-800 border-red-200'
}

const ACTION_LABELS: Record<string, string> = {
  'INSERT': 'Criação',
  'UPDATE': 'Atualização',
  'DELETE': 'Exclusão'
}

const TABLE_LABELS: Record<string, string> = {
  'projects': 'Projeto',
  'stages': 'Etapa',
  'tasks': 'Tarefa',
  'risks': 'Risco',
  'impediments': 'Impedimento',
  'project_deviations': 'Desvio',
  'comments': 'Comentário',
  'attachments': 'Anexo'
}

export function ProjectLogsTab({ projectId }: ProjectLogsTabProps) {
  const [expandedLogs, setExpandedLogs] = React.useState<Set<string>>(new Set())

  const { filters, updateFilter, resetFilters, goToPage } = useProjectLogsFilters({ limit: 10 })
  const { tables, users } = useProjectLogsFilterOptions(projectId)
  const { logs, pagination, loading, error, refetch } = useProjectLogs(projectId, filters)

  // logs e pagination já são obtidos diretamente dos hooks
  const totalPages = pagination?.totalPages || 0
  const currentPage = pagination?.page || 1

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const renderDiff = (oldData: Record<string, unknown>, newData: Record<string, unknown>) => {
    if (!oldData || !newData) return null

    const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = []
    
    // Comparar campos
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)])
    
    allKeys.forEach(key => {
      if (key === 'updated_at' || key === 'created_at') return // Ignorar campos de timestamp
      
      const oldValue = oldData[key]
      const newValue = newData[key]
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, oldValue, newValue })
      }
    })

    if (changes.length === 0) return null

    return (
      <div className="mt-4 space-y-2">
        <h4 className="font-medium text-sm text-gray-700">Alterações:</h4>
        <div className="space-y-2">
          {changes.map(({ field, oldValue, newValue }) => (
            <div key={field} className="bg-gray-50 p-3 rounded-md text-sm">
              <div className="font-medium text-gray-600 mb-1">{field}:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-red-600 font-medium">Antes:</span>
                  <div className="bg-red-50 p-2 rounded border border-red-200 mt-1">
                    {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue || 'null')}
                  </div>
                </div>
                <div>
                  <span className="text-green-600 font-medium">Depois:</span>
                  <div className="bg-green-50 p-2 rounded border border-green-200 mt-1">
                    {typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue || 'null')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Logs atualizados!')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-red-500 text-center mb-4">
            Erro ao carregar logs: {error}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </h3>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar logs..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por ação */}
          <Select value={filters.action_type || 'all'} onValueChange={(value) => updateFilter('action_type', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por tabela */}
          <Select value={filters.table_name || 'all'} onValueChange={(value) => updateFilter('table_name', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <FileText className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as entidades</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  {TABLE_LABELS[table] || table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por usuário */}
          <Select value={filters.user_id || 'all'} onValueChange={(value) => updateFilter('user_id', value === 'all' ? undefined : value)}>
            <SelectTrigger>
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros de data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data inicial
            </label>
            <Input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => updateFilter('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data final
            </label>
            <Input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => updateFilter('end_date', e.target.value)}
            />
          </div>
        </div>

        {/* Botão limpar filtros */}
        <div className="flex justify-end">
          <Button onClick={resetFilters} variant="outline" size="sm">
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Carregando logs...</span>
            </CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Nenhum log encontrado com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log: ProjectLog) => {
            const isExpanded = expandedLogs.has(log.id)
            return (
              <Card key={log.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={ACTION_COLORS[log.action_type] || 'bg-gray-100 text-gray-800 border-gray-200'}
                        >
                          {ACTION_LABELS[log.action_type] || log.action_type}
                        </Badge>
                        <Badge variant="secondary">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">
                        {log.description || `${ACTION_LABELS[log.action_type] || log.action_type} em ${TABLE_LABELS[log.table_name] || log.table_name}`}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user?.full_name || log.user?.email || 'Usuário não encontrado'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    {log.action_type === 'UPDATE' && log.old_data && log.new_data ? (
                      renderDiff(log.old_data, log.new_data)
                    ) : (
                      <div className="space-y-4">
                        {log.old_data && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                              {log.action_type === 'DELETE' ? 'Dados removidos:' : 'Dados anteriores:'}
                            </h4>
                            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_data && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                              {log.action_type === 'INSERT' ? 'Dados criados:' : 'Novos dados:'}
                            </h4>
                            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Página {currentPage} de {totalPages} ({pagination?.total || 0} logs no total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}