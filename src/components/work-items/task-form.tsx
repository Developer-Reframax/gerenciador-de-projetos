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
import { Clock } from 'lucide-react'
import { useUsers } from '@/hooks/use-projects'
import type { Database } from '@/types'

const taskSchema = z.object({
  title: z.string().min(1, 'Nome da tarefa é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta']),
  estimated_hours: z.number().min(0.5, 'Duração mínima é 0.5 horas'),
  responsible_id: z.string().optional(),
  stage_id: z.string().min(1, 'Etapa é obrigatória')
})

type TaskFormData = z.infer<typeof taskSchema>

const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta'
}

interface CreateTaskForm {
  title: string
  description?: string
  priority: 'baixa' | 'media' | 'alta'
  estimated_hours: number
  responsible_id?: string
  stage_id: string
}

interface TaskFormProps {
  task?: Database['public']['Tables']['tasks']['Row']
  stages: Array<{ id: string; name: string }>
  onSubmit: (data: CreateTaskForm) => Promise<void>
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
      estimated_hours: task?.estimated_hours || 1,
      responsible_id: task?.assignee_id || '',
      stage_id: task?.stage_id || defaultStageId || ''
    }
  })

  const handleSubmit = async (data: TaskFormData) => {
    try {
      const submitData: CreateTaskForm = {
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

        {/* Prioridade e Duração */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
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

          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duração (horas)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="Horas"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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