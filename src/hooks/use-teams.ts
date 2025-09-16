import { useState, useEffect, useCallback } from 'react';
import { Team, TeamWithMembers, TeamWithBasicMembers, CreateTeamData, UpdateTeamData } from '@/types/team';
import { toast } from 'sonner';

export function useTeams() {
  const [teams, setTeams] = useState<TeamWithBasicMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/teams');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar equipes');
      }
      
      setTeams(data.teams || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamData: CreateTeamData): Promise<Team | null> => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar equipe');
      }
      
      toast.success('Equipe criada com sucesso!');
      await fetchTeams(); // Recarregar lista
      return data.team;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    createTeam,
    refetch: fetchTeams
  };
}

export function useTeam(teamId: string) {
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar equipe');
      }
      
      setTeam(data.team);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const updateTeam = async (updateData: UpdateTeamData): Promise<Team | null> => {
    if (!teamId) return null;
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar equipe');
      }
      
      toast.success('Equipe atualizada com sucesso!');
      await fetchTeam(); // Recarregar dados
      return data.team;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const deleteTeam = async (): Promise<boolean> => {
    if (!teamId) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar equipe');
      }
      
      toast.success('Equipe deletada com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId, fetchTeam]);

  return {
    team,
    loading,
    error,
    fetchTeam,
    updateTeam,
    deleteTeam,
    refetch: fetchTeam
  };
}