'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { useGanttData, useUpdateProjectDates } from '@/hooks/use-gantt-data';
import { GanttFilters, type GanttFilters as GanttFiltersType } from '@/components/gantt/gantt-filters';
import { GanttChart, type GanttProject } from '@/components/gantt/gantt-chart';
import { ProjectDetailsModal } from '@/components/gantt/project-details-modal';

export default function GanttPage() {
  const [filters, setFilters] = useState<GanttFiltersType>({
    status: [],
    priority: [],
    team_id: null,
    start_date: null,
    end_date: null
  });
  
  const [selectedProject, setSelectedProject] = useState<GanttProject | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { projects, isLoading, error, refetch } = useGanttData(filters);
  const { updateDates } = useUpdateProjectDates();

  const handleFiltersChange = (newFilters: Partial<GanttFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const handleResetFilters = () => {
    setFilters({
      status: [],
      priority: [],
      team_id: null,
      start_date: null,
      end_date: null
    });
  };
  
  const handleProjectClick = (project: GanttProject) => {
    setSelectedProject(project);
  };
  
  const handleCloseModal = () => {
    setSelectedProject(null);
  };
  
  const handleDateChange = async (projectId: string, dates: { start_date?: string | null; due_date?: string | null }) => {
    try {
      await updateDates(projectId, dates);
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar datas:', error);
    }
  };
  
  const handleProjectUpdate = async (projectId: string, updates: Partial<GanttProject>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar projeto');
      }
      
      refetch(); // Recarregar dados após atualização
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gráfico de Gantt</h1>
            <p className="text-muted-foreground mt-1">
              Visualização em timeline dos projetos
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gráfico de Gantt</h1>
          <p className="text-muted-foreground mt-1">
            Visualização em timeline dos projetos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <GanttFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onResetFilters={handleResetFilters}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Estatísticas rápidas */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">Total de Projetos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Math.round(projects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / projects.length) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Progresso Médio</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Gráfico de Gantt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Timeline dos Projetos
            </CardTitle>
            {projects && (
              <div className="text-sm text-muted-foreground">
                {projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <GanttChart
            projects={projects || []}
            onProjectClick={handleProjectClick}
            onDateChange={handleDateChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
      
      {/* Modal de detalhes */}
      <ProjectDetailsModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={handleCloseModal}
        onUpdate={handleProjectUpdate}
      />
    </div>
  );
}
