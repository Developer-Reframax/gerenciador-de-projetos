'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Users, 
  Clock, 
  Target,  
  Save, 
  X,
  Edit3
} from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_PRIORITY_LABELS } from '@/types/project';
import { GanttProject } from './gantt-chart';
import { toast } from 'sonner';

interface ProjectDetailsModalProps {
  project: GanttProject | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (projectId: string, updates: Partial<GanttProject>) => Promise<void>;
}



export function ProjectDetailsModal({ 
  project, 
  isOpen, 
  onClose, 
  onUpdate 
}: ProjectDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectDetails, setProjectDetails] = useState<GanttProject | null>(null);
  const [editForm, setEditForm] = useState<Partial<GanttProject>>({});

  // Carregar detalhes completos do projeto
  useEffect(() => {
    if (project && isOpen) {
      loadProjectDetails(project.id);
    }
  }, [project, isOpen]);

  const loadProjectDetails = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectDetails(data.project);
        setEditForm(data.project);
      } else {
        toast.error('Erro ao carregar detalhes do projeto');
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      toast.error('Erro ao carregar detalhes do projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project || !onUpdate) return;
    
    setIsSaving(true);
    try {
      await onUpdate(project.id, editForm);
      setProjectDetails(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      toast.success('Projeto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(projectDetails || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof GanttProject, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (!project) return null;

  const details = projectDetails || project;
  // Calcular progresso baseado nas tarefas concluídas
  const progressPercentage = details.total_tasks && details.total_tasks > 0 
    ? Math.round(((details.completed_tasks || 0) / details.total_tasks) * 100)
    : (details.progress || 0);
  const tasksProgress = details.total_tasks ? 
    `${details.completed_tasks || 0}/${details.total_tasks}` : 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? (
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                  placeholder="Nome do projeto"
                />
              ) : (
                details.name
              )}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {onUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status e Prioridade */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                {isEditing ? (
                  <Select
                    value={editForm.status || details.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary">
                    {PROJECT_STATUS_LABELS[details.status as keyof typeof PROJECT_STATUS_LABELS]}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                {isEditing ? (
                  <Select
                    value={editForm.priority || details.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">
                    {PROJECT_PRIORITY_LABELS[details.priority as keyof typeof PROJECT_PRIORITY_LABELS]}
                  </Badge>
                )}
              </div>

              {details.team && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Equipe</Label>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{details.team.name}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Data de Início
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm.start_date ? format(new Date(editForm.start_date), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {details.start_date ? format(new Date(details.start_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Data de Fim
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm.due_date ? format(new Date(editForm.due_date), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {details.due_date ? format(new Date(details.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Não definida'}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Progresso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Progresso
                </Label>
                <span className="text-sm font-medium">{progressPercentage}%</span>
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress || 0}
                    onChange={(e) => handleInputChange('progress', parseInt(e.target.value) || 0)}
                    placeholder="Progresso (%)"
                  />
                </div>
              ) : (
                <Progress value={progressPercentage} className="h-2" />
              )}
              
              {details.total_tasks && (
                <p className="text-xs text-muted-foreground">
                  Tarefas concluídas: {tasksProgress}
                </p>
              )}
            </div>

            {/* Descrição */}
            {(details.description || isEditing) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descrição do projeto"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {details.description || 'Sem descrição'}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Orçamento */}
            {(details.budget || isEditing) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Orçamento</Label>
                  
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Orçamento Total</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.budget || ''}
                          onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span>Orçamento: R$ {details.budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Informações de criação/atualização */}
            {(details.created_at || details.updated_at) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  {details.created_at && (
                    <div>
                      <span className="font-medium">Criado em:</span>
                      <br />
                      {format(new Date(details.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  )}
                  {details.updated_at && (
                    <div>
                      <span className="font-medium">Atualizado em:</span>
                      <br />
                      {format(new Date(details.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Botões de ação */}
            {isEditing && (
              <>
                <Separator />
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}