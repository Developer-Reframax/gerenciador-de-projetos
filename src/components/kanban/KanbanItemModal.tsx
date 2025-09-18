import React from 'react';
import {
  KanbanTask,
  KanbanProject
} from '@/types/kanban';
import {
  X,
  Calendar,
  User,
  Flag,
  Clock,
  Edit3,
  Save,
  AlertCircle,
  CheckCircle,
  Circle,
  Folder,
  BarChart3
} from 'lucide-react';

interface KanbanItemModalProps {
  item: KanbanTask | KanbanProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (item: KanbanTask | KanbanProject) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  readonly?: boolean;
}

/**
 * Modal para visualizar e editar detalhes de tarefas e projetos do Kanban
 */
export function KanbanItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  readonly = false
}: KanbanItemModalProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editedItem, setEditedItem] = React.useState<KanbanTask | KanbanProject | null>(null);
  
  // Reset estado quando o modal abre/fecha ou item muda
  React.useEffect(() => {
    if (isOpen && item) {
      setEditedItem({ ...item });
      setIsEditing(false);
    } else {
      setEditedItem(null);
      setIsEditing(false);
    }
  }, [isOpen, item]);
  
  if (!isOpen || !item || !editedItem) {
    return null;
  }
  
  const isTask = 'project_id' in item;
  
  const handleSave = async () => {
    if (!onSave || !editedItem) return;
    
    try {
      setIsSaving(true);
      await onSave(editedItem);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setEditedItem({ ...item });
    setIsEditing(false);
  };
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {isTask ? (
                <CheckCircle className="h-6 w-6 text-blue-600" />
              ) : (
                <Folder className="h-6 w-6 text-green-600" />
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {isTask ? 'Detalhes da Tarefa' : 'Detalhes do Projeto'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {!readonly && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {isTask ? (
              <TaskDetails
                task={editedItem as KanbanTask}
                isEditing={isEditing}
                onChange={(task) => setEditedItem(task)}
              />
            ) : (
              <ProjectDetails
                project={editedItem as KanbanProject}
                isEditing={isEditing}
                onChange={(project) => setEditedItem(project)}
              />
            )}
          </div>
          
          {/* Footer */}
          {!readonly && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Salvar</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Componente para exibir/editar detalhes de uma tarefa
 */
interface TaskDetailsProps {
  task: KanbanTask;
  isEditing: boolean;
  onChange: (task: KanbanTask) => void;
}

function TaskDetails({ task, isEditing, onChange }: TaskDetailsProps) {
  const statusOptions: Array<{ value: string; label: string; icon: React.ReactNode }> = [
    { value: 'todo', label: 'A Fazer', icon: <Circle className="h-4 w-4" /> },
    { value: 'in_progress', label: 'Em Andamento', icon: <Clock className="h-4 w-4" /> },
    { value: 'review', label: 'Em Revisão', icon: <AlertCircle className="h-4 w-4" /> },
    { value: 'done', label: 'Concluído', icon: <CheckCircle className="h-4 w-4" /> }
  ];
  
  const priorityOptions: Array<{ value: string; label: string; color: string }> = [
    { value: 'high', label: 'Alta', color: 'text-red-600' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600' },
    { value: 'low', label: 'Baixa', color: 'text-green-600' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título
        </label>
        {isEditing ? (
          <input
            type="text"
            value={task.title}
            onChange={(e) => onChange({ ...task, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-lg font-semibold text-gray-900">{task.title}</p>
        )}
      </div>
      
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        {isEditing ? (
          <textarea
            value={task.description || ''}
            onChange={(e) => onChange({ ...task, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva os detalhes da tarefa..."
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {task.description || 'Nenhuma descrição fornecida.'}
          </p>
        )}
      </div>
      
      {/* Informações em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          {isEditing ? (
            <select
              value={task.status}
              onChange={(e) => onChange({ ...task, status: e.target.value as KanbanTask['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              {statusOptions.find(s => s.value === task.status)?.icon}
              <span className="text-gray-900">
                {statusOptions.find(s => s.value === task.status)?.label}
              </span>
            </div>
          )}
        </div>
        
        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Flag className="inline h-4 w-4 mr-1" />
            Prioridade
          </label>
          {isEditing ? (
            <select
              value={task.priority}
              onChange={(e) => onChange({ ...task, priority: e.target.value as KanbanTask['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              <Flag className={`h-4 w-4 ${priorityOptions.find(p => p.value === task.priority)?.color}`} />
              <span className="text-gray-900">
                {priorityOptions.find(p => p.value === task.priority)?.label}
              </span>
            </div>
          )}
        </div>
        
        {/* Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="inline h-4 w-4 mr-1" />
            Responsável
          </label>
          <p className="text-gray-900">{task.assigned_to || 'Não atribuído'}</p>
        </div>
        
        {/* Projeto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Folder className="inline h-4 w-4 mr-1" />
            Projeto
          </label>
          <p className="text-gray-900">{task.project_name || 'Não definido'}</p>
        </div>
        
        {/* Data de vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Vencimento
          </label>
          {isEditing ? (
            <input
              type="date"
              value={task.due_date || ''}
              onChange={(e) => onChange({ ...task, due_date: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">
              {task.due_date 
                ? new Date(task.due_date).toLocaleDateString('pt-BR')
                : 'Não definida'
              }
            </p>
          )}
        </div>
        
        {/* Posição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BarChart3 className="inline h-4 w-4 mr-1" />
            Posição
          </label>
          <p className="text-gray-900">
            {task.position}
          </p>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID da Tarefa
          </label>
          <p className="text-sm text-gray-600 font-mono">
            {task.id}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Avatar do Responsável
          </label>
          <p className="text-sm text-gray-600">
            {task.assigned_avatar ? 'Definido' : 'Não definido'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para exibir/editar detalhes de um projeto
 */
interface ProjectDetailsProps {
  project: KanbanProject;
  isEditing: boolean;
  onChange: (project: KanbanProject) => void;
}

function ProjectDetails({ project, isEditing, onChange }: ProjectDetailsProps) {
  const statusOptions: Array<{ value: string; label: string; icon: React.ReactNode }> = [
    { value: 'planning', label: 'Planejamento', icon: <Circle className="h-4 w-4" /> },
    { value: 'active', label: 'Ativo', icon: <Clock className="h-4 w-4" /> },
    { value: 'on_hold', label: 'Em Espera', icon: <AlertCircle className="h-4 w-4" /> },
    { value: 'completed', label: 'Concluído', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'cancelled', label: 'Cancelado', icon: <X className="h-4 w-4" /> }
  ];
  
  const priorityOptions: Array<{ value: string; label: string; color: string }> = [
    { value: 'high', label: 'Alta', color: 'text-red-600' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600' },
    { value: 'low', label: 'Baixa', color: 'text-green-600' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Projeto
        </label>
        {isEditing ? (
          <input
            type="text"
            value={project.name}
            onChange={(e) => onChange({ ...project, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <p className="text-lg font-semibold text-gray-900">{project.name}</p>
        )}
      </div>
      
      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        {isEditing ? (
          <textarea
            value={project.description || ''}
            onChange={(e) => onChange({ ...project, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descreva os objetivos e escopo do projeto..."
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {project.description || 'Nenhuma descrição fornecida.'}
          </p>
        )}
      </div>
      
      {/* Informações em grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          {isEditing ? (
            <select
              value={project.status}
              onChange={(e) => onChange({ ...project, status: e.target.value as KanbanProject['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              {statusOptions.find(s => s.value === project.status)?.icon}
              <span className="text-gray-900">
                {statusOptions.find(s => s.value === project.status)?.label}
              </span>
            </div>
          )}
        </div>
        
        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Flag className="inline h-4 w-4 mr-1" />
            Prioridade
          </label>
          {isEditing ? (
            <select
              value={project.priority}
              onChange={(e) => onChange({ ...project, priority: e.target.value as KanbanProject['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              <Flag className={`h-4 w-4 ${priorityOptions.find(p => p.value === project.priority)?.color}`} />
              <span className="text-gray-900">
                {priorityOptions.find(p => p.value === project.priority)?.label}
              </span>
            </div>
          )}
        </div>
        
        {/* Total de Tarefas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BarChart3 className="inline h-4 w-4 mr-1" />
            Total de Tarefas
          </label>
          <p className="text-gray-900">{project.total_tasks}</p>
        </div>
        
        {/* Tarefas Concluídas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CheckCircle className="inline h-4 w-4 mr-1" />
            Tarefas Concluídas
          </label>
          <p className="text-gray-900">{project.completed_tasks}</p>
        </div>
        
        {/* Data de início */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Início
          </label>
          {isEditing ? (
            <input
              type="date"
              value={project.start_date || ''}
              onChange={(e) => onChange({ ...project, start_date: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">
              {project.start_date 
                ? new Date(project.start_date).toLocaleDateString('pt-BR')
                : 'Não definida'
              }
            </p>
          )}
        </div>
        
        {/* Data de fim */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Data de Fim
          </label>
          {isEditing ? (
            <input
              type="date"
              value={project.end_date || ''}
              onChange={(e) => onChange({ ...project, end_date: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900">
              {project.end_date 
                ? new Date(project.end_date).toLocaleDateString('pt-BR')
                : 'Não definida'
              }
            </p>
          )}
        </div>
      </div>
      
      {/* Progresso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <BarChart3 className="inline h-4 w-4 mr-1" />
          Progresso
        </label>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {project.progress || 0}%
          </span>
        </div>
      </div>
      
      {/* Informações adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID do Projeto
          </label>
          <p className="text-sm text-gray-600 font-mono">
            {project.id}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Equipe
          </label>
          <p className="text-sm text-gray-600">
            {project.team_name || 'Não definida'}
          </p>
        </div>
      </div>
    </div>
  );
}
