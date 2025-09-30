'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, RotateCcw } from 'lucide-react';
import { PROJECT_STATUS_LABELS, PROJECT_PRIORITY_LABELS } from '@/types/project';

export interface GanttFilters {
  status: string[];
  priority: string[];
  team_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface GanttFiltersProps {
  filters: GanttFilters;
  onFiltersChange: (filters: Partial<GanttFilters>) => void;
  onResetFilters: () => void;
}

export function GanttFilters({
  filters,
  onFiltersChange,
  onResetFilters
}: GanttFiltersProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);

  // Carregar equipes
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error('Erro ao carregar equipes:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  const handleStatusChange = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ status: newStatus });
  };

  const handlePriorityChange = (priority: string) => {
    const newPriority = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    onFiltersChange({ priority: newPriority });
  };

  const handleTeamChange = (teamId: string) => {
    onFiltersChange({ team_id: teamId === 'all' ? null : teamId });
  };

  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    onFiltersChange({ [field]: value || null });
  };

  const removeStatusFilter = (status: string) => {
    onFiltersChange({ status: filters.status.filter(s => s !== status) });
  };

  const removePriorityFilter = (priority: string) => {
    onFiltersChange({ priority: filters.priority.filter(p => p !== priority) });
  };

  const hasActiveFilters = 
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.team_id !== null ||
    filters.start_date !== null ||
    filters.end_date !== null;

  return (
    <div className="space-y-4">
      {/* Primeira linha - Status e Prioridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <Button
                key={value}
                variant={filters.status.includes(value) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusChange(value)}
                className="text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
          {filters.status.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.status.map(status => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS]}
                  <button
                    onClick={() => removeStatusFilter(status)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Prioridade */}
        <div className="space-y-2">
          <Label>Classificação – Prioridade Estratégica</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => (
              <Button
                key={value}
                variant={filters.priority.includes(value) ? "default" : "outline"}
                size="sm"
                onClick={() => handlePriorityChange(value)}
                className="text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
          {filters.priority.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.priority.map(priority => (
                <Badge key={priority} variant="secondary" className="text-xs">
                  {PROJECT_PRIORITY_LABELS[priority as keyof typeof PROJECT_PRIORITY_LABELS]}
                  <button
                    onClick={() => removePriorityFilter(priority)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Segunda linha - Equipe e Datas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Equipe */}
        <div className="space-y-2">
          <Label>Equipe</Label>
          <Select
            value={filters.team_id || 'all'}
            onValueChange={handleTeamChange}
            disabled={isLoadingTeams}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as equipes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data de Início */}
        <div className="space-y-2">
          <Label>Data de Início (a partir de)</Label>
          <Input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleDateChange('start_date', e.target.value)}
          />
        </div>

        {/* Data de Fim */}
        <div className="space-y-2">
          <Label>Data de Fim (até)</Label>
          <Input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleDateChange('end_date', e.target.value)}
          />
        </div>
      </div>

      {/* Botão de Reset */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
