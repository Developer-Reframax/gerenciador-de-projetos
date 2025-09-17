'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useTeam } from '@/hooks/use-teams';
import { useTeamMembers } from '@/hooks/use-team-members';
import { TeamMembersList } from '@/components/teams/team-members-list';
import { TeamForm } from '@/components/teams/team-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Shield, 
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UpdateTeamData, AddTeamMemberData, UpdateTeamMemberData } from '@/types/team';

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const teamId = params?.id as string;
  
  const { team, loading: teamLoading, error: teamError, updateTeam, deleteTeam } = useTeam(teamId);
  const { 
    members, 
    loading: membersLoading, 
    addMember, 
    updateMember, 
    removeMember 
  } = useTeamMembers(teamId);
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Funções auxiliares
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'archived': return 'Arquivada';
      default: return 'Desconhecido';
    }
  };

  // Handlers
  const handleAddMember = async (data: AddTeamMemberData) => {
    await addMember(data);
  };

  const handleUpdateMember = async (memberId: string, data: UpdateTeamMemberData) => {
    await updateMember(memberId, data);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember(memberId);
  };

  const handleUpdateTeam = async (data: UpdateTeamData) => {
    setIsUpdating(true);
    try {
      await updateTeam(data);
      setShowEditDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (window.confirm('Tem certeza que deseja deletar esta equipe? Esta ação não pode ser desfeita.')) {
      await deleteTeam();
      router.push('/teams');
    }
  };

  // Verificar permissões
  const userMembership = members.find(m => m.user?.id === user?.id);
  const canManageTeam = userMembership?.role === 'owner' || 
    (userMembership?.role === 'admin' && userMembership.permissions?.can_manage_team);
  const canManageMembers = userMembership?.role === 'owner' || 
    (userMembership?.role === 'admin' && userMembership.permissions?.can_invite_members);

  // Estados de loading e erro
  if (teamError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar equipe</h2>
            <p className="text-muted-foreground mb-4">{teamError}</p>
            <Button onClick={() => router.push('/teams')}>
              Voltar para Equipes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (teamLoading || membersLoading || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando equipe...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/teams')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-4 flex-1">
          <Avatar className="h-16 w-16">
            <AvatarImage src={team.avatar_url || undefined} alt={team.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {getInitials(team.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <Badge 
                variant="outline" 
                className={getStatusColor(team.status)}
              >
                {getStatusText(team.status)}
              </Badge>
              {team.is_private ? (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Privada</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Globe className="w-3 h-3" />
                  <span>Pública</span>
                </Badge>
              )}
            </div>
            
            {team.description && (
              <p className="text-muted-foreground mb-2">{team.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{members.length} membros</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Criada {team.created_at ? formatDistanceToNow(new Date(team.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  }) : 'recentemente'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {canManageTeam && (
          <div className="flex items-center space-x-2">
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Equipe</DialogTitle>
                  <DialogDescription>
                    Atualize as informações e configurações da equipe.
                  </DialogDescription>
                </DialogHeader>
                <TeamForm
                  team={team}
                  onSubmit={handleUpdateTeam}
                  onCancel={() => setShowEditDialog(false)}
                  isLoading={isUpdating}
                />
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteTeam}
            >
              Deletar Equipe
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações principais */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Equipe</CardTitle>
                  <CardDescription>
                    Detalhes e configurações da equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Visibilidade</h4>
                      <div className="flex items-center space-x-2">
                        {team.is_private ? (
                          <>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Privada</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Pública</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Status</h4>
                      <Badge className={getStatusColor(team.status)}>
                        {getStatusText(team.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Configurações</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Requer aprovação para novos membros</span>
                        <Badge variant="outline">
                          {team.settings?.require_approval_for_members ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Membros podem convidar outros</span>
                        <Badge variant="outline">
                          {team.settings?.allow_member_invite ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Projetos públicos por padrão</span>
                        <Badge variant="outline">
                          {team.settings?.default_project_visibility === 'public' ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {members.length}
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">Membros</div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Proprietários</span>
                        <span>{members.filter(m => m.role === 'owner').length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Administradores</span>
                        <span>{members.filter(m => m.role === 'admin').length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Membros</span>
                        <span>{members.filter(m => m.role === 'member').length}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          0
                        </div>
                        <div className="text-sm text-muted-foreground">Projetos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <TeamMembersList
            members={members}
            teamId={teamId}
            canManageMembers={canManageMembers}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onRemoveMember={handleRemoveMember}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {canManageTeam ? (
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Equipe</CardTitle>
                <CardDescription>
                  Gerencie as configurações e permissões da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    As configurações da equipe podem ser editadas através do formulário de edição.
                  </p>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-destructive mb-2">Zona de Perigo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deletar esta equipe removerá permanentemente todos os dados associados.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteTeam}
                    >
                      Deletar Equipe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar as configurações desta equipe.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
