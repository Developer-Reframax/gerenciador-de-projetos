import React from 'react';
import type {
  KanbanTask,
  KanbanProject
} from '@/types/kanban';
import {
  X,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle,
  Folder,
  Users,
  Plus
} from 'lucide-react';

interface KanbanCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (item: Partial<KanbanTask> | Partial<KanbanProject>) => Promise<void>;
  itemType: 'task' | 'project';
  defaultValues?: {
    project_id?: string;
    status?: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'planning' | 'active' | 'review';
    assignee_id?: string;
    team_id?: string;
    assigned_to?: string;
    title?: string;
    name?: string;
    description?: string;
    priority?: 'baixa' | 'media' | 'alta';
    due_date?: string;
    start_date?: string;
    team_name?: string;
  };
  availableProjects?: Array<{ id: string; name: string }>;
  availableUsers?: Array<{ id: string; name: string }>;
  availableTeams?: Array<{ id: string; name: string }>;
}

/**
 * Modal para criação de novas tarefas e projetos no Kanban
 */
export function KanbanCreateModal({
  isOpen,
  onClose,
  onCreate,
  itemType,
  defaultValues = {},
  availableProjects = [],
  availableUsers = [],
  availableTeams = []
}: KanbanCreateModalProps) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<KanbanTask> | Partial<KanbanProject>>(() => {
    if (itemType === 'task') {
      return {
        title: ('title' in defaultValues && defaultValues.title) ? defaultValues.title : '',
        description: ('description' in defaultValues && defaultValues.description) ? defaultValues.description : '',
        priority: ('priority' in defaultValues ? defaultValues.priority as 'baixa' | 'media' | 'alta' : null) || 'media',
        status: ('status' in defaultValues ? defaultValues.status as 'todo' | 'in_progress' | 'in_review' | 'completed' : null) || 'todo',
        project_id: ('project_id' in defaultValues && defaultValues.project_id) ? defaultValues.project_id : '',
        assigned_to: ('assigned_to' in defaultValues && defaultValues.assigned_to) ? defaultValues.assigned_to : '',
        due_date: ('due_date' in defaultValues && defaultValues.due_date) ? defaultValues.due_date : ''
      } as Partial<KanbanTask>;
    } else {
      return {
        name: ('name' in defaultValues && defaultValues.name) ? defaultValues.name : '',
        description: ('description' in defaultValues && defaultValues.description) ? defaultValues.description : '',
        priority: ('priority' in defaultValues ? defaultValues.priority as 'baixa' | 'media' | 'alta' : null) || 'media',
        status: ('status' in defaultValues ? defaultValues.status as 'planning' | 'active' | 'review' | 'completed' : null) || 'planning',
        start_date: ('start_date' in defaultValues && defaultValues.start_date) ? defaultValues.start_date : ''
      } as Partial<KanbanProject>;
    }
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  // Reset form quando o modal abre/fecha
  React.useEffect(() => {
    if (isOpen) {
      const initialData = itemType === 'task' 
        ? {
            title: '',
            description: '',
            status: defaultValues.status || 'todo',
            priority: 'media' as 'baixa' | 'media' | 'alta',
            project_id: defaultValues.project_id || '',
            assigned_to: 'assigned_to' in defaultValues ? defaultValues.assigned_to || '' : '',
            due_date: ''
          }
        : {
            name: '',
            description: '',
            status: defaultValues.status || 'planning',
            priority: 'media' as 'baixa' | 'media' | 'alta',
            team_name: 'team_name' in defaultValues ? defaultValues.team_name || '' : '',
            start_date: ''
          };
      
      setFormData(initialData as Partial<KanbanTask> | Partial<KanbanProject>);
      setErrors({});
    }
  }, [isOpen, itemType, defaultValues]);
  
  if (!isOpen) {
    return null;
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (itemType === 'task') {
      if (!(formData as Partial<KanbanTask>).title?.trim()) {
        newErrors.title = 'Título é obrigatório';
      }
      if (!(formData as Partial<KanbanTask>).project_id) {
        newErrors.project_id = 'Projeto é obrigatório';
      }
    } else {
      if (!(formData as Partial<KanbanProject>).name?.trim()) {
        newErrors.name = 'Nome é obrigatório';
      }
      if (!(formData as Partial<KanbanProject>).team_name) {
        newErrors.team_name = 'Equipe é obrigatória';
      }
    }
    
    // Validação de datas removida - propriedades não existem nos tipos
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Preparar dados para envio
      const dataToSend = { ...formData };
      
      // Limpar campos vazios
      Object.keys(dataToSend).forEach(key => {
        const value = (dataToSend as Record<string, unknown>)[key];
        if (value === '' || value === null) {
          delete (dataToSend as Record<string, unknown>)[key];
        }
      });
      

      
      await onCreate(dataToSend);
      onClose();
    } catch (error) {
      console.error('Erro ao criar item:', error);
      setErrors({ general: 'Erro ao criar item. Tente novamente.' });
    } finally {
      setIsCreating(false);
    }
  };
  
  const updateFormData = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {itemType === 'task' ? (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              ) : (
                <Folder className="h-6 w-6 text-green-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {itemType === 'task' ? 'Nova Tarefa' : 'Novo Projeto'}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {errors.general}
              </div>
            )}
            
            {itemType === 'task' ? (
              <TaskForm
                formData={formData}
                errors={errors}
                onChange={updateFormData}
                availableProjects={availableProjects}
                availableUsers={availableUsers}
              />
            ) : (
              <ProjectForm
                formData={formData}
                errors={errors}
                onChange={updateFormData}
                availableTeams={availableTeams}
                availableUsers={availableUsers}
              />
            )}
          </form>
          
          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isCreating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Criar {itemType === 'task' ? 'Tarefa' : 'Projeto'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Formulário para criação de tarefas
 */
interface TaskFormProps {
  formData: Partial<KanbanTask> | Partial<KanbanProject>;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
  availableProjects: Array<{ id: string; name: string }>;
  availableUsers: Array<{ id: string; name: string }>;
}

function TaskForm({ formData, errors, onChange, availableProjects, availableUsers }: TaskFormProps) {
  const statusOptions: Array<{ value: 'todo' | 'in_progress' | 'in_review' | 'completed'; label: string }> = [
     { value: 'todo', label: 'A Fazer' },
     { value: 'in_progress', label: 'Em Andamento' },
     { value: 'in_review', label: 'Em Revisão' },
     { value: 'completed', label: 'Concluído' }
   ];
  
  const priorityOptions: Array<{ value: 'tactical' | 'important' | 'priority'; label: string }> = [
     { value: 'priority', label: 'Prioritário' },
     { value: 'important', label: 'Importante' },
     { value: 'tactical', label: 'Tático' }
   ];
  
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Título *
        </label>
        <input
          type="text"
          value={(formData as Partial<KanbanTask>).title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Digite o título da tarefa"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>
      
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Descreva os detalhes da tarefa..."
        />
      </div>
      
      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projeto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Folder className="inline h-4 w-4 mr-1" />
            Projeto *
          </label>
          <select
            value={(formData as Partial<KanbanTask>).project_id || ''}
            onChange={(e) => onChange('project_id', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.project_id ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecionar projeto</option>
            {availableProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.project_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.project_id}</p>
          )}
        </div>
        
        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Responsável
          </label>
          <select
            value={(formData as Partial<KanbanTask>).assigned_to || ''}
            onChange={(e) => onChange('assigned_to', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Não atribuído</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status || 'todo'}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Flag className="inline h-4 w-4 mr-1" />
            Classificação – Prioridade Estratégica
          </label>
          <select
            value={formData.priority || 'important'}
            onChange={(e) => onChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Data de vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Vencimento
          </label>
          <input
            type="date"
            value={(formData as Partial<KanbanTask>).due_date || ''}
            onChange={(e) => onChange('due_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        {/* Estimativa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Estimativa (horas)
          </label>
          <input
            type="text"
            placeholder="Estimativa de horas (opcional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            disabled
          />

        </div>
      </div>
    </div>
  );
}

/**
 * Formulário para criação de projetos
 */
interface ProjectFormProps {
  formData: Partial<KanbanTask> | Partial<KanbanProject>;
  errors: Record<string, string>;
  onChange: (field: string, value: string | number) => void;
  availableTeams: Array<{ id: string; name: string }>;
  availableUsers: Array<{ id: string; name: string }>;
}

function ProjectForm({ formData, errors, onChange, availableTeams, availableUsers }: ProjectFormProps) {
  const statusOptions: Array<{ value: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled'; label: string }> = [
     { value: 'not_started', label: 'Não Iniciado' },
     { value: 'in_progress', label: 'Em execução' },
     { value: 'paused', label: 'Paralisado' },
     { value: 'completed', label: 'Concluído' },
     { value: 'cancelled', label: 'Cancelado' }
   ];
  
  const priorityOptions: Array<{ value: 'tactical' | 'important' | 'priority'; label: string }> = [
     { value: 'priority', label: 'Prioritário' },
     { value: 'important', label: 'Importante' },
     { value: 'tactical', label: 'Tático' }
   ];
  
  return (
    <div className="space-y-6">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome do Projeto *
        </label>
        <input
          type="text"
          value={(formData as Partial<KanbanProject>).name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
            errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="Digite o nome do projeto"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
        )}
      </div>
      
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Descreva os objetivos e escopo do projeto..."
        />
      </div>
      
      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="inline h-4 w-4 mr-1" />
            Equipe *
          </label>
          <select
            value={(formData as Partial<KanbanProject>).team_name || ''}
            onChange={(e) => onChange('team_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Selecionar equipe</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

        </div>
        
        {/* Gerente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Gerente
          </label>
          <select
            value=""
            onChange={() => {}}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            disabled
          >
            <option value="">Não atribuído</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={formData.status || 'not_started'}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Flag className="inline h-4 w-4 mr-1" />
            Classificação – Prioridade Estratégica
          </label>
          <select
            value={formData.priority || 'important'}
            onChange={(e) => onChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Data de início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Início
          </label>
          <input
            type="date"
            value={(formData as Partial<KanbanProject>).start_date || ''}
            onChange={(e) => onChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        {/* Data de fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Fim
          </label>
          <input
            type="date"
            value={(formData as Partial<KanbanProject>).end_date || ''}
            onChange={(e) => onChange('end_date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.end_date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_date}</p>
          )}
        </div>
      </div>
    </div>
  );
}
