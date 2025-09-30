'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useWorkflow } from '@/hooks/use-workflows'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Workflow } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { WorkflowWorkItems } from '@/components/workflows/workflow-work-items'
import { WorkflowComments } from '@/components/workflows/workflow-comments'
import { WorkflowAttachments } from '@/components/workflows/workflow-attachments'

export default function WorkflowDetailsPage() {
  const params = useParams()
  const workflowId = params?.id as string
  const { workflow, loading, error } = useWorkflow(workflowId)
  const [activeTab, setActiveTab] = useState('details')

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fluxo de trabalho não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'O fluxo de trabalho solicitado não existe ou você não tem permissão para visualizá-lo.'}</p>
          <Link href="/workflows">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Fluxos de Trabalho
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejamento': return 'bg-gray-100 text-gray-800'
      case 'em_andamento': return 'bg-green-100 text-green-800'
      case 'concluido': return 'bg-blue-100 text-blue-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planejamento': return 'Planejamento'
      case 'em_andamento': return 'Em Andamento'
      case 'concluido': return 'Concluído'
      case 'cancelado': return 'Cancelado'
      default: return 'Não definido'
    }
  }



  const getCategoryText = (category: string) => {
    switch (category) {
      case 'iniciativa': return 'Iniciativa'
      case 'melhoria': return 'Melhoria'
      default: return 'Não definida'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'bg-gray-100 text-gray-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'critica': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'baixa': return 'Baixa'
      case 'media': return 'Média'
      case 'alta': return 'Alta'
      case 'critica': return 'Crítica'
      default: return 'Não definida'
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/workflows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{workflow.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(workflow.status || 'planejamento')}>
                {getStatusText(workflow.status || 'planejamento')}
              </Badge>
              <Badge variant="outline">
                <Workflow className="w-3 h-3 mr-1" />
                {getCategoryText(workflow.category || 'iniciativa')}
              </Badge>
              <Badge className={getPriorityColor(workflow.priority || 'media')}>
                {getPriorityText(workflow.priority || 'media')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="stages">Itens de Trabalho</TabsTrigger>
          <TabsTrigger value="comments">Comentários</TabsTrigger>
          <TabsTrigger value="attachments">Anexos</TabsTrigger>
        </TabsList>

        {/* Aba Detalhes */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Informações Gerais</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(workflow.status)}`}>
                    {getStatusText(workflow.status)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Categoria:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {getCategoryText(workflow.category)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Prioridade:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getPriorityColor(workflow.priority)}`}>
                    {getPriorityText(workflow.priority)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Data de Início:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {workflow.start_date ? format(new Date(workflow.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Data de Término:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {workflow.end_date ? format(new Date(workflow.end_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </span>
                </div>

              </div>
            </div>

            {/* Responsáveis */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Responsáveis</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Criado por:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {workflow.creator?.full_name || workflow.creator?.email || 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Criado em:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {workflow.created_at ? format(new Date(workflow.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Não definido'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Última atualização:</span>
                  <span className="ml-2 text-sm dark:text-gray-300">
                    {workflow.updated_at ? format(new Date(workflow.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Não definido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {workflow.total_stages || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total de Etapas</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {workflow.completed_stages || 0}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Concluídos</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {workflow.total_tasks || 0}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Total de Tarefas</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {workflow.progress_percentage || 0}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Progresso</div>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {workflow.description && (
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Descrição</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {workflow.description}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Aba Itens de Trabalho */}
        <TabsContent value="stages">
          {activeTab === 'stages' && <WorkflowWorkItems workflowId={workflowId} />}
        </TabsContent>



        {/* Aba Comentários */}
        <TabsContent value="comments">
          {activeTab === 'comments' && <WorkflowComments workflowId={workflowId} />}
        </TabsContent>

        {/* Aba Anexos */}
        <TabsContent value="attachments">
          {activeTab === 'attachments' && <WorkflowAttachments workflowId={workflowId} />}
        </TabsContent>


      </Tabs>
    </div>
  )
}