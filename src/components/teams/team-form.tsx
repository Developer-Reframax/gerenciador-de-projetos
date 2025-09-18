'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Team, CreateTeamData, UpdateTeamData } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const teamFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  is_private: z.boolean(),
  status: z.enum(['active', 'inactive', 'archived']),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
  settings: z.object({
    allow_member_invite: z.boolean(),
    require_approval: z.boolean(),
    max_members: z.number().min(1).max(1000).optional(),
  }).optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team?: Team;
  onSubmit: (data: CreateTeamData | UpdateTeamData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeamForm({ team, onSubmit, onCancel, isLoading = false }: TeamFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || '',
      description: team?.description || '',
      is_private: team?.is_private || false,
      status: team?.status || 'active',
      avatar_url: team?.avatar_url || '',
      settings: {
        allow_member_invite: team?.settings?.allow_member_invite ?? true,
        require_approval: team?.settings?.require_approval ?? false,
        max_members: team?.settings?.max_members || undefined,
      },
    },
  });

  const handleSubmit = async (data: TeamFormData) => {
    try {
      setIsSubmitting(true);
      
      // Limpar avatar_url se estiver vazio
      const submitData = {
        ...data,
        avatar_url: data.avatar_url || undefined,
        settings: data.settings || {
          allow_member_invite: true,
          require_approval: false,
        },
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar equipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!team;
  const loading = isLoading || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Equipe *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome da equipe" 
                    {...field} 
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o propósito da equipe" 
                    rows={3}
                    {...field} 
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  Uma breve descrição sobre a equipe e seus objetivos.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatar_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Avatar</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://exemplo.com/avatar.jpg" 
                    type="url"
                    {...field} 
                    disabled={loading}
                  />
                </FormControl>
                <FormDescription>
                  URL da imagem que será usada como avatar da equipe.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                      <SelectItem value="archived">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.max_members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Membros</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Sem limite" 
                      min={1}
                      max={1000}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Configurações da Equipe</h4>
            
            <FormField
              control={form.control}
              name="is_private"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Equipe Privada</FormLabel>
                    <FormDescription>
                      Apenas membros convidados podem ver e participar desta equipe.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.allow_member_invite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Membros Podem Convidar</FormLabel>
                    <FormDescription>
                      Permite que membros da equipe convidem outros usuários.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.require_approval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requer Aprovação</FormLabel>
                    <FormDescription>
                      Novos membros precisam ser aprovados antes de entrar na equipe.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Atualizar' : 'Criar'} Equipe
          </Button>
        </div>
      </form>
    </Form>
  );
}
