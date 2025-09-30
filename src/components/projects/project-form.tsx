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
import { useProjectMutations, useUsers, useUserTeams } from '@/hooks/use-projects'
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS
} from '@/types/project'

const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'paused', 'completed', 'cancelled']),
  priority: z.enum(['tactical', 'important', 'priority']),
  team_id: z.string().optional(),
  requester_id: z.string().min(1, 'Solicitante é obrigatório')
})

type ProjectFormData = z.infer<typeof projectSchema>

// As interfaces Team e User agora vêm dos hooks

interface ProjectFormProps {
  project?: Project
  onSuccess?: (project: Project) => void
  onCancel?: () => void
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { createProject, updateProject, loading } = useProjectMutations()
  const { teams } = useUserTeams()
  const { users } = useUsers()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'not_started',
      priority: project?.priority || 'important',
      team_id: project?.team_id || '',
      requester_id: project?.owner_id || ''
    }
  })

  // Os dados de teams e users agora vêm dos hooks useUserTeams e useUsers

  const onSubmit = async (data: ProjectFormData) => {
    try {
      let result: Project

      if (project) {
        // Atualizar projeto existente
        const updateData: UpdateProjectData = {
          id: project.id,
          ...data,
          team_id: data.team_id === 'none' ? undefined : data.team_id || undefined
        }
        result = await updateProject(project.id, updateData)
      } else {
        // Criar novo projeto
        const createData: CreateProjectData = {
          ...data,
          team_id: data.team_id === 'none' ? undefined : data.team_id || undefined
        }
        result = await createProject(createData)
      }

      if (result && onSuccess) {
        onSuccess?.(result)
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nome do projeto */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Projeto *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome do projeto" {...field} />
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
                  placeholder="Descreva o projeto (opcional)"
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
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
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
              <FormLabel>Classificação – Prioridade Estratégica</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a prioridade estratégica" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => (
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

        {/* Solicitante */}
        <FormField
          control={form.control}
          name="requester_id"
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

        {/* Equipe */}
        <FormField
          control={form.control}
          name="team_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipe</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma equipe (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="none">Nenhuma equipe</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {loading ? 'Salvando...' : project ? 'Atualizar' : 'Criar Projeto'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
