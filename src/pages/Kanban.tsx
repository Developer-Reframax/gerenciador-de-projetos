'use client';
import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { toast } from 'sonner';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { KanbanItemModal } from '../components/kanban/KanbanItemModal';
import { KanbanCreateModal } from '../components/kanban/KanbanCreateModal';
import { useKanbanData } from '../hooks/useKanbanData';
import { useKanbanDragDrop } from '../hooks/useKanbanDragDrop';
import { useKanbanRealTime } from '../hooks/useKanbanRealTime';
import type {
  KanbanViewType,
  KanbanTask,
  KanbanProject,
  KanbanData
} from '../../shared/types/kanban';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Página principal do sistema Kanban
 * Visualização fixa por projetos
 */
export function Kanban() {
  // Estados principais - visualização fixa por projeto
  const viewType: KanbanViewType = 'project';
  const [localData, setLocalData] = useState<KanbanData | null>(null);

  // Estados dos modais
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedProject, setSelectedProject] = useState<KanbanProject | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Hook para dados do Kanban - sem filtros
  const { data, loading, error, refetch, updateItem } = useKanbanData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Usar dados locais se disponíveis, senão usar dados do hook
  const currentData = localData || data;

  // Callback para atualizar dados localmente
  const handleDataUpdate = useCallback((newData: KanbanData) => {
    setLocalData(newData);
  }, []);

  // Tipo local para notificações
  type RealtimeNotification = {
    message: string;
    timestamp: Date;
  };

  // Callback para notificações em tempo real
  const handleNotification = useCallback((notification: RealtimeNotification) => {
    toast.info(notification.message, {
      description: `Atualização em tempo real - ${notification.timestamp.toLocaleTimeString()}`
    });
  }, []);

  // Hook para drag and drop
  const {
    dragState,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  } = useKanbanDragDrop({
    data: currentData,
    viewType,
    onDataUpdate: handleDataUpdate,
    onItemUpdate: async (itemId: string, updates: Partial<KanbanTask | KanbanProject>) => {
      await updateItem(itemId, updates);
    }
  });

  // Hook para atualizações em tempo real
  const { isConnected, lastUpdate } = useKanbanRealTime({
    viewType,
    data: currentData,
    onDataUpdate: handleDataUpdate,
    onNotification: handleNotification,
    enabled: true
  });



  // Handlers para modais
  const handleItemClick = useCallback((item: KanbanTask | KanbanProject) => {
    // Verificar se é uma tarefa (tem project_id) ou projeto (não tem)
    if ('project_id' in item) {
      setSelectedTask(item as KanbanTask);
    } else {
      setSelectedProject(item as KanbanProject);
    }
  }, []);



  // Handler para refresh manual
  const handleRefresh = useCallback(async () => {
    setLocalData(null);
    await refetch();
    toast.success('Dados atualizados com sucesso!');
  }, [refetch]);

  // Renderizar loading
  if (loading && !currentData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dados do Kanban...</span>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (error && !currentData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
          <p>{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Tentar novamente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Kanban</h1>
            
            {/* Status da conexão em tempo real */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              {lastUpdate && (
                <span className="text-gray-500">
                  • Última atualização: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Botão de refresh */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>



      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <KanbanBoard
            data={currentData}
            viewType={viewType}
            onItemClick={handleItemClick}
            loading={loading}
          />
          
          {/* Overlay para drag and drop */}
          <DragOverlay>
            {dragState.activeItem && (
              <KanbanCard
                item={dragState.activeItem}
                viewType={viewType}
                isDragging
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modais */}
      {(selectedTask || selectedProject) && (
        <KanbanItemModal
          item={selectedTask || selectedProject}
          isOpen={!!(selectedTask || selectedProject)}
          onClose={() => {
            setSelectedTask(null);
            setSelectedProject(null);
          }}
          onSave={async (updates) => {
            const item = selectedTask || selectedProject;
            if (item) {
              await updateItem(item.id, updates);
              setSelectedTask(null);
              setSelectedProject(null);
            }
          }}
          onDelete={async (id) => {
            // TODO: Implementar função de delete
            console.log('Delete item:', id);
            setSelectedTask(null);
            setSelectedProject(null);
          }}
        />
      )}

      {(showCreateTask || showCreateProject) && (
        <KanbanCreateModal
          itemType={showCreateTask ? 'task' : 'project'}
          isOpen={showCreateTask || showCreateProject}
          onClose={() => {
            setShowCreateTask(false);
            setShowCreateProject(false);
          }}
          onCreate={async (data) => {
            // TODO: Implementar função de create
            console.log('Create item:', data);
            setShowCreateTask(false);
            setShowCreateProject(false);
            await handleRefresh();
          }}
          defaultValues={{}}
        />
      )}
    </div>
  );
}

// Export default para compatibilidade com Next.js
export default Kanban;