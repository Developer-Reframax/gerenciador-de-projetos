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
import type { CreateImpedimentForm, Database } from '@/types'

const impedimentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  responsible_id: z.string().min(1, 'Responsável é obrigatório'),
  expected_resolution_date: z.string().optional(),
  criticality: z.enum(['alta', 'media', 'baixa']),
  status: z.enum(['aberto', 'em_resolucao', 'resolvido', 'cancelado'])
})

type ImpedimentFormData = z.infer<typeof impedimentSchema>

const CRITICALITY_LABELS = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa'
}

const STATUS_LABELS = {
  aberto: 'Aberto',
  em_resolucao: 'Em Resolução',
  resolvido: 'Resolvido',
  cancelado: 'Cancelado'
}

interface ImpedimentFormProps {
  impediment?: Database['public']['Tables']['impediments']['Row']
  stageId: string
  onSubmit: (data: CreateImpedimentForm) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function ImpedimentForm({ impediment, stageId, onSubmit, onCancel, loading }: ImpedimentFormProps) {
  const { users } = useUsers()

  const form = useForm<ImpedimentFormData>({
    resolver: zodResolver(impedimentSchema),
    defaultValues: {
      description: impediment?.description || '',
      responsible_id: impediment?.responsible_id || '',
      expected_resolution_date: impediment?.expected_resolution_date ? impediment.expected_resolution_date.split('T')[0] : '',
      criticality: impediment?.criticality || 'media',
      status: impediment?.status || 'aberto'
    }
  })

  const handleSubmit = async (data: ImpedimentFormData) => {
    try {
      const submitData: CreateImpedimentForm = {
        ...data,
        stage_id: stageId,
        responsible_id: data.responsible_id || '',
        identification_date: new Date().toISOString().split('T')[0],
        expected_resolution_date: data.expected_resolution_date || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar impedimento:', error)
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
                  placeholder="Descreva o impedimento (opcional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />



        {/* Criticidade */}
        <FormField
          control={form.control}
          name="criticality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Criticidade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a criticidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CRITICALITY_LABELS).map(([value, label]) => (
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
            {loading ? 'Salvando...' : impediment ? 'Atualizar' : 'Criar Impedimento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}