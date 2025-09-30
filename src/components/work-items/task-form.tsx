'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
// Clock import removed as estimated_hours field was removed
import { useUsers } from '@/hooks/use-projects'
import type { Database } from '@/types'

const taskSchema = z.object({
  title: z.string().min(1, 'Nome da tarefa é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta']),
  estimated_hours: z.number().min(0).optional(),
  responsible_id: z.string().optional(),
  stage_id: z.string().min(1, 'Etapa é obrigatória')
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: Database['public']['Tables']['tasks']['Row']
  stages: Array<{ id: string; name: string }>
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  defaultStageId?: string
}

export function TaskForm({ task, stages, onSubmit, onCancel, loading, defaultStageId }: TaskFormProps) {
  const { users } = useUsers()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      priority: (task?.priority as 'baixa' | 'media' | 'alta') || 'media',
      estimated_hours: task?.estimated_hours || 0,
      responsible_id: task?.assignee_id || '',
      stage_id: task?.stage_id || defaultStageId || ''
    }
  })

  const handleSubmit = async (data: TaskFormData) => {
    try {
      const submitData: TaskFormData = {
        ...data,
        responsible_id: data.responsible_id || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Nome da Tarefa */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Tarefa *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Digite o nome da tarefa"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição da tarefa (opcional)"
                  rows={3}
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

        {/* Prioridade */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classificação – Prioridade Estratégica</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a prioridade estratégica" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estimativa de Horas */}
        <FormField
          control={form.control}
          name="estimated_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimativa de Horas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
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
                    <SelectValue placeholder="Selecionar responsável" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
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

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : task ? 'Salvar Alterações' : 'Criar Tarefa'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}