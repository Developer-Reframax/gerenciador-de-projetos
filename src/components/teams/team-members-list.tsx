'use client';

import { useState } from 'react';
import { TeamMemberWithUser, AddTeamMemberData, UpdateTeamMemberData } from '@/types/team';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  MoreVertical, 
  Crown, 
  Shield, 
  Mail, 
  Calendar,
  Search,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAvailableUsers } from '@/hooks/use-team-members';

interface TeamMembersListProps {
  members: TeamMemberWithUser[];
  teamId: string;
  currentUserId?: string;
  canManageMembers?: boolean;
  onAddMember?: (data: AddTeamMemberData) => Promise<void>;
  onUpdateMember?: (memberId: string, data: UpdateTeamMemberData) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
  isLoading?: boolean;
}

export function TeamMembersList({
  members,
  teamId,
  currentUserId,
  canManageMembers = false,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  isLoading = false
}: TeamMembersListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const { users, loading: searchLoading, searchUsers, clearUsers } = useAvailableUsers(teamId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Proprietário';
      case 'admin':
        return 'Administrador';
      case 'member':
        return 'Membro';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      await searchUsers(query);
    } else {
      clearUsers();
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !onAddMember) return;

    try {
      setIsSubmitting(true);
      await onAddMember({
        user_id: selectedUser,
        role: selectedRole,
      });
      
      // Reset form
      setSelectedUser('');
      setSelectedRole('member');
      setSearchQuery('');
      clearUsers();
      setShowAddDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!onUpdateMember) return;
    
    try {
      await onUpdateMember(memberId, { role: newRole });
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!onRemoveMember) return;
    
    if (confirm(`Tem certeza que deseja inativar ${memberName} da equipe?`)) {
      try {
        await onRemoveMember(memberId);
      } catch (error) {
        console.error('Erro ao inativar membro:', error);
      }
    }
  };

  const handleToggleStatus = async (memberId: string, newStatus: 'active' | 'inactive', memberName: string) => {
    const action = newStatus === 'active' ? 'ativar' : 'inativar';
    
    if (confirm(`Tem certeza que deseja ${action} ${memberName}?`)) {
      try {
        const response = await fetch(`/api/teams/${teamId}/members/${memberId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao alterar status do membro');
        }

        // Recarregar a página ou atualizar a lista
        window.location.reload();
      } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert('Erro ao alterar status do membro');
      }
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (confirm(`ATENÇÃO: Tem certeza que deseja remover DEFINITIVAMENTE ${memberName} da equipe? Esta ação não pode ser desfeita.`)) {
      try {
        const response = await fetch(`/api/teams/${teamId}/members/${memberId}/delete`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover membro definitivamente');
        }

        // Recarregar a página ou atualizar a lista
        window.location.reload();
      } catch (error) {
        console.error('Erro ao remover membro definitivamente:', error);
         alert('Erro ao remover membro definitivamente');
       }
     }
   };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Membros da Equipe</span>
              <Badge variant="secondary">{members.length}</Badge>
            </CardTitle>
            <CardDescription>
              Gerencie os membros e suas permissões na equipe
            </CardDescription>
          </div>
          
          {canManageMembers && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Membro</DialogTitle>
                  <DialogDescription>
                    Busque e adicione um usuário à equipe
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Buscar Usuário</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Digite nome ou email..."
                        value={searchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        className="pl-10 w-full"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>

                  {users.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selecionar Usuário</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Escolha um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(user.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.full_name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Papel na Equipe</Label>
                    <Select value={selectedRole} onValueChange={(value: 'admin' | 'member') => setSelectedRole(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membro</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddDialog(false)}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddMember}
                      disabled={!selectedUser || isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando membros...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum membro encontrado</p>
            <p className="text-sm">Adicione membros para começar a colaborar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(member.user?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{member.user?.full_name || 'Usuário'}</h4>
                      {member.role === 'owner' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {member.role === 'admin' && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{member.user?.email || 'Email não disponível'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleColor(member.role)}`}
                      >
                        {getRoleText(member.role)}
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(member.status)}`}
                      >
                        {member.status === 'active' ? 'Ativo' : 
                         member.status === 'pending' ? 'Pendente' : 'Inativo'}
                      </Badge>
                      
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Entrou {member.created_at ? formatDistanceToNow(new Date(member.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          }) : 'recentemente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {canManageMembers && member.user?.id !== currentUserId && member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === 'member' && (
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Promover a Admin
                        </DropdownMenuItem>
                      )}
                      {member.role === 'admin' && (
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')}>
                          Rebaixar a Membro
                        </DropdownMenuItem>
                      )}
                      
                      {member.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleToggleStatus(member.id, 'inactive', member.user?.full_name || 'Usuário')}>
                          Inativar Membro
                        </DropdownMenuItem>
                      )}
                      
                      {(member.status === 'inactive' || member.status === 'pending') && (
                        <DropdownMenuItem onClick={() => handleToggleStatus(member.id, 'active', member.user?.full_name || 'Usuário')}>
                          Ativar Membro
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member.id, member.user?.full_name || 'Usuário')}
                        className="text-orange-600 focus:text-orange-600"
                      >
                        Inativar da Equipe
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteMember(member.id, member.user?.full_name || 'Usuário')}
                        className="text-red-600 focus:text-red-600"
                      >
                        Remover Definitivamente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
