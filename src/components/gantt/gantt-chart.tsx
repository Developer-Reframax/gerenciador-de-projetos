'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { format, addDays, differenceInDays, startOfWeek, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_PRIORITY_LABELS } from '@/types/project';

import { GanttProject as GanttProjectType } from '@/hooks/use-gantt-data';

export type GanttProject = GanttProjectType;

interface GanttChartProps {
  projects: GanttProject[];
  onProjectClick?: (project: GanttProject) => void;
  onDateChange?: (projectId: string, dates: { start_date?: string | null; due_date?: string | null }) => void;
  isLoading?: boolean;
}

const PRIORITY_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
};

const STATUS_COLORS = {
  planning: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  on_hold: 'bg-yellow-600',
  completed: 'bg-green-600',
  cancelled: 'bg-red-600'
};

export function GanttChart({ projects, onProjectClick, onDateChange, isLoading }: GanttChartProps) {
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { locale: ptBR });
  });
  
  const [dragState, setDragState] = useState<{
    projectId: string;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: Date;
    originalEnd: Date;
  } | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Configurações responsivas
  const DAYS_TO_SHOW = isMobile ? 14 : 28; // 2 semanas no mobile, 4 no desktop
  const DAY_WIDTH = isMobile ? 30 : 40;
  const ROW_HEIGHT = isMobile ? 50 : 60;
  const PROJECT_NAME_WIDTH = isMobile ? 180 : 264;
  
  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calcular período visível
  const viewEnd = addDays(viewStart, DAYS_TO_SHOW - 1);
  const days = eachDayOfInterval({ start: viewStart, end: viewEnd });

  // Processar projetos para o período visível
  const visibleProjects = useMemo(() => {
    return projects.filter(project => project.start_date && project.due_date).map(project => {
      const projectStart = new Date(project.start_date!);
      const projectEnd = new Date(project.due_date!);
      
      // Calcular posição e largura da barra
      const startOffset = Math.max(0, differenceInDays(projectStart, viewStart));
      const endOffset = Math.min(DAYS_TO_SHOW - 1, differenceInDays(projectEnd, viewStart));
      
      const left = startOffset * DAY_WIDTH;
      const width = Math.max(DAY_WIDTH, (endOffset - startOffset + 1) * DAY_WIDTH);
      
      // Verificar se o projeto está visível no período atual
      const isVisible = projectEnd >= viewStart && projectStart <= viewEnd;
      
      return {
        ...project,
        left,
        width,
        isVisible,
        startOffset,
        endOffset
      };
    }).filter(p => p.isVisible);
  }, [projects, viewStart, DAYS_TO_SHOW, DAY_WIDTH, viewEnd]);

  // Navegação
  const goToPreviousWeek = () => {
    setViewStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setViewStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    const today = new Date();
    setViewStart(startOfWeek(today, { locale: ptBR }));
  };

  // Handlers de drag
  const handleMouseDown = (e: React.MouseEvent, project: GanttProject, type: 'move' | 'resize-start' | 'resize-end') => {
    if (!onDateChange) return;
    
    e.preventDefault();
    setDragState({
      projectId: project.id,
      type,
      startX: e.clientX,
      originalStart: new Date(project.start_date!),
      originalEnd: new Date(project.due_date!)
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !onDateChange) return;
    
    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / DAY_WIDTH);
    
    let newStart = dragState.originalStart;
    let newEnd = dragState.originalEnd;
    
    switch (dragState.type) {
      case 'move':
        newStart = addDays(dragState.originalStart, daysDelta);
        newEnd = addDays(dragState.originalEnd, daysDelta);
        break;
      case 'resize-start':
        newStart = addDays(dragState.originalStart, daysDelta);
        if (newStart >= dragState.originalEnd) {
          newStart = addDays(dragState.originalEnd, -1);
        }
        break;
      case 'resize-end':
        newEnd = addDays(dragState.originalEnd, daysDelta);
        if (newEnd <= dragState.originalStart) {
          newEnd = addDays(dragState.originalStart, 1);
        }
        break;
    }
    
    // Atualizar visualmente (você pode implementar um estado temporário aqui)
  }, [dragState, onDateChange, DAY_WIDTH]);

  const handleMouseUp = useCallback(() => {
    if (!dragState || !onDateChange) return;
    
    const project = projects.find(p => p.id === dragState.projectId);
    if (project) {
      // Aqui você chamaria onDateChange com as novas datas
      // onDateChange(dragState.projectId, newStart.toISOString(), newEnd.toISOString());
    }
    
    setDragState(null);
  }, [dragState, onDateChange, projects]);

  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de navegação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
            {!isMobile && <span className="ml-1">Anterior</span>}
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="w-4 h-4" />
            {!isMobile && <span className="ml-1">Hoje</span>}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            {!isMobile && <span className="mr-1">Próximo</span>}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm font-medium">
          {format(viewStart, isMobile ? 'dd/MM' : 'dd MMM', { locale: ptBR })} - {format(viewEnd, isMobile ? 'dd/MM/yy' : 'dd MMM yyyy', { locale: ptBR })}
        </div>
      </div>

      {/* Gráfico de Gantt */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho com datas */}
        <div className="bg-muted/50 border-b overflow-x-auto">
          <div className="flex min-w-max">
            <div className="border-r bg-background p-3" style={{ width: PROJECT_NAME_WIDTH }}>
              <span className="font-medium text-sm">Projeto</span>
            </div>
            <div className="flex">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-shrink-0 p-2 border-r text-center",
                    isMobile ? "text-xs" : "text-xs",
                    isWeekend(day) && "bg-muted/30",
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "bg-primary/10 font-medium"
                  )}
                  style={{ width: DAY_WIDTH }}
                >
                  <div className="font-medium">{format(day, 'dd')}</div>
                  {!isMobile && (
                    <div className="text-muted-foreground">{format(day, 'EEE', { locale: ptBR }).slice(0, 3)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linhas dos projetos */}
        <div className="relative overflow-x-auto" ref={chartRef}>
          {visibleProjects.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className={isMobile ? "text-sm" : ""}>Nenhum projeto encontrado no período selecionado</p>
              </div>
            </div>
          ) : (
            <div className="min-w-max">
              {visibleProjects.map((project) => (
                <div key={project.id} className="flex border-b hover:bg-muted/30 transition-colors">
                  {/* Informações do projeto */}
                  <div className="border-r bg-background p-3" style={{ width: PROJECT_NAME_WIDTH }}>
                    <div className="space-y-1">
                      <div className="font-medium text-sm truncate" title={project.name}>
                        {project.name}
                      </div>
                      <div className={cn("flex items-center gap-1", isMobile ? "flex-col items-start" : "space-x-2")}>
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs", STATUS_COLORS[project.status as keyof typeof STATUS_COLORS])}
                        >
                          {isMobile 
                            ? project.status.charAt(0).toUpperCase() + project.status.slice(1, 3)
                            : PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]
                          }
                        </Badge>
                        {!isMobile && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {PROJECT_PRIORITY_LABELS[project.priority as keyof typeof PROJECT_PRIORITY_LABELS]}
                          </Badge>
                        )}
                      </div>
                      {project.team && !isMobile && (
                        <div className="text-xs text-muted-foreground truncate">
                          {project.team.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative flex-1" style={{ height: ROW_HEIGHT }}>
                    {/* Grid de fundo */}
                    <div className="absolute inset-0 flex">
                      {days.map((day) => (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "border-r",
                            isWeekend(day) && "bg-muted/20",
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "bg-primary/5"
                          )}
                          style={{ width: DAY_WIDTH }}
                        />
                      ))}
                    </div>

                    {/* Barra do projeto */}
                    <div
                      className={cn(
                        "absolute top-3 h-8 rounded cursor-pointer transition-all hover:opacity-80",
                        PRIORITY_COLORS[project.priority as keyof typeof PRIORITY_COLORS] || "bg-blue-500"
                      )}
                      style={{
                        left: project.left,
                        width: project.width,
                        minWidth: DAY_WIDTH
                      }}
                      onClick={() => onProjectClick?.(project)}
                      onMouseDown={(e) => handleMouseDown(e, project, 'move')}
                    >
                      {/* Barra de progresso */}
                      <div
                        className="h-full bg-white/30 rounded-l transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                      
                      {/* Handles de redimensionamento */}
                      {onDateChange && (
                        <>
                          <div
                            className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/20"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, project, 'resize-start');
                            }}
                          />
                          <div
                            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-white/20"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleMouseDown(e, project, 'resize-end');
                            }}
                          />
                        </>
                      )}
                      
                      {/* Texto do projeto */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span className="text-white text-xs font-medium truncate">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className={cn(
        "text-xs text-muted-foreground",
        isMobile ? "space-y-3" : "flex items-center justify-between"
      )}>
        <div className={cn(
          "flex items-center",
          isMobile ? "flex-wrap gap-2" : "space-x-4"
        )}>
          <span className="font-medium">Prioridades:</span>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center space-x-1">
              <div className={cn("w-3 h-3 rounded", color)} />
              <span>
                {isMobile 
                  ? priority.charAt(0).toUpperCase() + priority.slice(1, 3)
                  : PROJECT_PRIORITY_LABELS[priority as keyof typeof PROJECT_PRIORITY_LABELS]
                }
              </span>
            </div>
          ))}
        </div>
        <div className={isMobile ? "text-left" : "text-right"}>
          <p>Clique em um projeto para ver detalhes</p>
          {onDateChange && !isMobile && <p>Arraste para mover ou redimensionar</p>}
        </div>
      </div>
    </div>
  );
}