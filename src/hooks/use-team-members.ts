import { useState, useEffect, useCallback } from 'react';
import { TeamMemberWithUser, AddTeamMemberData, UpdateTeamMemberData } from '@/types/team';
import { toast } from 'sonner';

export function useTeamMembers(teamId: string) {
  const [members, setMembers] = useState<TeamMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/teams/${teamId}/members`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar membros da equipe');
      }
      
      setMembers(data.members || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const addMember = async (memberData: AddTeamMemberData): Promise<TeamMemberWithUser | null> => {
    if (!teamId) return null;
    
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar membro');
      }
      
      toast.success(data.message || 'Membro adicionado com sucesso!');
      await fetchMembers(); // Recarregar lista
      return data.member;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateMember = async (
    memberId: string, 
    updateData: UpdateTeamMemberData
  ): Promise<TeamMemberWithUser | null> => {
    if (!teamId || !memberId) return null;
    
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar membro');
      }
      
      toast.success('Membro atualizado com sucesso!');
      await fetchMembers(); // Recarregar lista
      return data.member;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!teamId || !memberId) return false;
    
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover membro');
      }
      
      toast.success(data.message || 'Membro removido com sucesso!');
      await fetchMembers(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  const updateMemberRole = async (memberId: string, role: 'admin' | 'member'): Promise<boolean> => {
    return (await updateMember(memberId, { role })) !== null;
  };

  const updateMemberStatus = async (memberId: string, status: 'active' | 'inactive'): Promise<boolean> => {
    return (await updateMember(memberId, { status })) !== null;
  };

  const updateMemberPermissions = async (
    memberId: string, 
    permissions: Partial<{
      can_manage_team: boolean;
      can_invite_members: boolean;
      can_create_projects: boolean;
      can_delete_projects: boolean;
    }>
  ): Promise<boolean> => {
    return (await updateMember(memberId, { permissions })) !== null;
  };

  useEffect(() => {
    fetchMembers();
  }, [teamId, fetchMembers]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    updateMember,
    removeMember,
    updateMemberRole,
    updateMemberStatus,
    updateMemberPermissions,
    refetch: fetchMembers
  };
}

// Hook para buscar usuários disponíveis para adicionar à equipe
export function useAvailableUsers(teamId?: string) {
  const [users, setUsers] = useState<Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        q: query,
        ...(teamId && { exclude_team: teamId })
      });
      
      const response = await fetch(`/api/users/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar usuários');
      }
      
      setUsers(data.users || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const clearUsers = () => {
    setUsers([]);
    setError(null);
  };

  return {
    users,
    loading,
    error,
    searchUsers,
    clearUsers
  };
}