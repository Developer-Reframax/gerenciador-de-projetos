'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/components/ui/form'
import { useUsers } from '@/hooks/use-projects'
import type { CreateRiskForm, Database } from '@/types'

const riskSchema = z.object({
  description: z.string().optional(),
  stage_id: z.string().min(1, 'Etapa é obrigatória'),
  impact: z.enum(['prazo', 'custo', 'qualidade', 'reputacao']),
  status: z.enum(['identificado', 'em_analise', 'em_mitigacao', 'monitorado', 'materializado', 'encerrado']),
  probability: z.enum(['baixa', 'media', 'alta']),
  responsible_id: z.string().optional(),
  expected_resolution_date: z.string().optional()
})

type RiskFormData = z.infer<typeof riskSchema>

const STATUS_LABELS = {
  identificado: 'Identificado',
  em_analise: 'Em Análise',
  em_mitigacao: 'Em Mitigação',
  monitorado: 'Monitorado',
  materializado: 'Materializado',
  encerrado: 'Encerrado'
}

const PROBABILITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
}

const IMPACT_LABELS = {
  prazo: 'Prazo',
  custo: 'Custo',
  qualidade: 'Qualidade',
  reputacao: 'Reputação'
}

interface RiskFormProps {
  risk?: Database['public']['Tables']['risks']['Row']
  stages: Array<{ id: string; name: string }>
  onSubmit: (data: CreateRiskForm) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function RiskForm({ risk, stages, onSubmit, onCancel, loading }: RiskFormProps) {
  const { users } = useUsers()

  const form = useForm<RiskFormData>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      description: risk?.description || '',
      stage_id: risk?.stage_id || '',
      status: risk?.status || 'identificado',
      probability: risk?.probability || 'media',
      impact: risk?.impact || 'prazo',
      responsible_id: risk?.responsible_id || '',
      expected_resolution_date: risk?.expected_resolution_date ? risk.expected_resolution_date.split('T')[0] : ''
    }
  })

  const handleSubmit = async (data: RiskFormData) => {
    try {
      const submitData: CreateRiskForm = {
        ...data,
        name: `Risco - ${data.description?.substring(0, 50) || 'Sem descrição'}`,
        responsible_id: data.responsible_id || '',
        identification_date: new Date().toISOString().split('T')[0],
        expected_resolution_date: data.expected_resolution_date || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar risco:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">


        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o risco (opcional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Etapa */}
        <FormField
          control={form.control}
          name="stage_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etapa *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a etapa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Probabilidade */}
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probabilidade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a probabilidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PROBABILITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
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
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Impacto */}
        <FormField
          control={form.control}
          name="impact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Impacto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o impacto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(IMPACT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Responsável */}
        <FormField
          control={form.control}
          name="responsible_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um usuário (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Data de Resolução Esperada */}
        <FormField
          control={form.control}
          name="expected_resolution_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Resolução Esperada</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione a data de resolução esperada"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : risk ? 'Atualizar' : 'Criar Risco'}
          </Button>
        </div>
      </form>
    </Form>
  )
}