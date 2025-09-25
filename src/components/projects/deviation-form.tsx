'use client'

import React from 'react'
import { useForm, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/hooks/use-auth'
import type { ProjectDeviation, DeviationEvaluationCriteria, DeviationImpactType, DeviationStatus } from '@/types/database'
import { toast } from 'sonner'

const deviationSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(2000, 'Descrição muito longa'),
  was_requested: z.boolean(),
  requested_by: z.string().optional(),
  evaluation_criteria: z.string().min(1, 'Critério de avaliação é obrigatório'),
  impact_type: z.string().min(1, 'Tipo de impacto é obrigatório'),
  requires_approval: z.boolean().default(false),
  approver_id: z.string().optional(),
  status: z.string().optional(),
  approval_date: z.string().optional(),
  approval_notes: z.string().optional()
}).refine((data) => {
  if (data.was_requested && !data.requested_by) {
    return false
  }
  if (data.requires_approval && !data.approver_id) {
    return false
  }
  return true
}, {
  message: 'Campos obrigatórios não preenchidos',
  path: ['requested_by']
})

type DeviationFormData = z.infer<typeof deviationSchema>

interface DeviationFormProps {
  projectId: string
  deviation?: ProjectDeviation
  onSuccess?: () => void
  onCancel?: () => void
}

const EVALUATION_CRITERIA: DeviationEvaluationCriteria[] = [
  'Fatores externo',
  'Inovação',
  'Medida corretiva',
  'Melhorias',
  'Repriorização'
]

const IMPACT_TYPES: DeviationImpactType[] = [
  'Custo/orçamento',
  'Aumento de escopo',
  'Não se aplica'
]

const STATUS_OPTIONS: DeviationStatus[] = [
  'Pendente',
  'Em análise',
  'Aprovado',
  'Rejeitado',
  'Implementado'
]

export function DeviationForm({ projectId, deviation, onSuccess, onCancel }: DeviationFormProps) {
  const { user } = useAuth()
  const { users } = useUsers()
  const [loading, setLoading] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(deviationSchema),
    defaultValues: {
      description: deviation?.description || '',
      was_requested: deviation?.was_requested || false,
      requested_by: deviation?.requested_by || '',
      evaluation_criteria: deviation?.evaluation_criteria || 'Fatores externo',
      impact_type: deviation?.impact_type || 'Não se aplica',
      requires_approval: deviation?.requires_approval || false,
      approver_id: deviation?.approver_id || '',
      status: deviation?.status || 'Pendente',
      approval_date: deviation?.approved_at ? new Date(deviation.approved_at).toISOString().split('T')[0] : '',
      approval_notes: deviation?.approval_notes || ''
    }
  })

  // Watch para campos condicionais
  const wasRequested = form.watch('was_requested')
  const requiresApproval = form.watch('requires_approval')

  const onSubmit = async (data: DeviationFormData) => {
    if (!user) {
      toast.error('Usuário não autenticado')
      return
    }

    setLoading(true)
    try {
      const url = deviation 
        ? `/api/projects/${projectId}/deviations/${deviation.id}`
        : `/api/projects/${projectId}/deviations`
      
      const method = deviation ? 'PUT' : 'POST'
      
      const requestData = {
        ...data,
        project_id: projectId,
        requested_by: data.was_requested ? (data.requested_by || user.id) : null,
        approver_id: data.requires_approval ? data.approver_id : null,
        status: data.status || 'Pendente',
        approved_at: data.approval_date || null,
        approval_notes: data.approval_notes || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar desvio')
      }

      toast.success(deviation ? 'Desvio atualizado com sucesso!' : 'Desvio criado com sucesso!')
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar desvio:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar desvio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data: DeviationFormData) => onSubmit(data))} className="space-y-6">
        {/* Foi Solicitado */}
        <FormField
          control={form.control as Control<DeviationFormData>}
          name="was_requested"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Foi Solicitado</FormLabel>
                <FormDescription>
                  Marque se este desvio foi solicitado por alguém
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Solicitante (condicional) */}
        {wasRequested && (
          <FormField
            control={form.control as Control<DeviationFormData>}
            name="requested_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Solicitante *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o solicitante" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Descrição */}
        <FormField
          control={form.control as Control<DeviationFormData>}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva detalhadamente o desvio"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Critério de Avaliação */}
        <FormField
          control={form.control as Control<DeviationFormData>}
          name="evaluation_criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critério de Avaliação *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o critério de avaliação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EVALUATION_CRITERIA.map((criteria) => (
                    <SelectItem key={criteria} value={criteria}>
                      {criteria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Impacto */}
        <FormField
          control={form.control as Control<DeviationFormData>}
          name="impact_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Impacto *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de impacto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {IMPACT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Requer Aprovação */}
        <FormField
          control={form.control as Control<DeviationFormData>}
          name="requires_approval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Requer Aprovação</FormLabel>
                <FormDescription>
                  Marque se este desvio precisa de aprovação antes da implementação
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Aprovador (condicional) */}
        {requiresApproval && (
          <FormField
            control={form.control as Control<DeviationFormData>}
            name="approver_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aprovador *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o aprovador" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Status (apenas para edição) */}
        {deviation && (
          <FormField
            control={form.control as Control<DeviationFormData>}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}



        {/* Data de Aprovação (apenas para edição) */}
        {deviation && (
          <FormField
            control={form.control as Control<DeviationFormData>}
            name="approval_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Aprovação</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Notas de Aprovação (apenas para edição) */}
        {deviation && (
          <FormField
            control={form.control as Control<DeviationFormData>}
            name="approval_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas de Aprovação</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Adicione notas sobre a aprovação do desvio"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}



        {/* Botões */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : deviation ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
