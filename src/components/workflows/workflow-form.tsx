'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useWorkflowMutations } from '@/hooks/use-workflows'
import type { Workflow, CreateWorkflowData, UpdateWorkflowData } from '@/types/workflow'
import {
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_PRIORITY_LABELS,
  WORKFLOW_CATEGORY_LABELS
} from '@/types/workflow'

const workflowSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  status: z.enum(['planejamento', 'em_andamento', 'concluido', 'cancelado']),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']),
  category: z.enum(['iniciativa', 'melhoria']),
  start_date: z.string().optional(),
  end_date: z.string().optional()
})

type WorkflowFormData = z.infer<typeof workflowSchema>

interface WorkflowFormProps {
  workflow?: Workflow
  onSuccess?: (workflow: Workflow) => void
  onCancel?: () => void
}

export function WorkflowForm({ workflow, onSuccess, onCancel }: WorkflowFormProps) {
  const { createWorkflow, updateWorkflow, loading } = useWorkflowMutations()

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      name: workflow?.name || '',
      description: workflow?.description || '',
      status: workflow?.status || 'planejamento',
      priority: workflow?.priority || 'media',
      category: workflow?.category || 'iniciativa',
      start_date: workflow?.start_date ? workflow.start_date.split('T')[0] : '',
      end_date: workflow?.end_date ? workflow.end_date.split('T')[0] : ''
    }
  })

  const onSubmit = async (data: WorkflowFormData) => {
    try {
      let result: Workflow

      if (workflow) {
        // Atualizar workflow existente
        const updateData: UpdateWorkflowData = {
          id: workflow.id,
          ...data,
          start_date: data.start_date || undefined,
          end_date: data.end_date || undefined
        }
        result = await updateWorkflow(workflow.id, updateData)
      } else {
        // Criar novo workflow
        const createData: CreateWorkflowData = {
          ...data,
          start_date: data.start_date || undefined,
          end_date: data.end_date || undefined
        }
        result = await createWorkflow(createData)
      }

      if (result && onSuccess) {
        onSuccess?.(result)
      }
    } catch (error) {
      console.error('Erro ao salvar fluxo de trabalho:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome do workflow */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Fluxo de Trabalho *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do fluxo de trabalho" {...field} />
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
                  placeholder="Descreva o fluxo de trabalho (opcional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
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
                  {Object.entries(WORKFLOW_STATUS_LABELS).map(([value, label]) => (
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

        {/* Prioridade */}
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
                  {Object.entries(WORKFLOW_PRIORITY_LABELS).map(([value, label]) => (
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

        {/* Categoria */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(WORKFLOW_CATEGORY_LABELS).map(([value, label]) => (
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

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione a data de início"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Término</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione a data de término"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>



        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : workflow ? 'Atualizar' : 'Criar Fluxo de Trabalho'}
          </Button>
        </div>
      </form>
    </Form>
  )
}