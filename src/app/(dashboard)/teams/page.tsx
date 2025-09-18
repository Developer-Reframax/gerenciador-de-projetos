'use client';

import { useState } from 'react';
import { useTeams } from '@/hooks/use-teams';
import { Team, CreateTeamData, UpdateTeamData } from '@/types/team';
import { TeamCard } from '@/components/teams/team-card';
import { TeamForm } from '@/components/teams/team-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeamsPage() {
  const { teams, loading, error, createTeam, refetch } = useTeams();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  // Filtrar equipes baseado na busca e filtros
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateTeam = async (data: CreateTeamData | UpdateTeamData) => {
    try {
      setIsCreating(true);
      const newTeam = await createTeam(data as CreateTeamData);
      if (newTeam) {
        setShowCreateDialog(false);
      }
    } catch (error) {
      console.error('Erro ao criar equipe:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeam = () => {
    // TODO: Implementar edição inline ou modal
    toast.info('Funcionalidade de edição será implementada em breve');
  };

  const handleDeleteTeam = async (team: Team) => {
    if (confirm(`Tem certeza que deseja deletar a equipe "${team.name}"?`)) {
      // TODO: Implementar deleção
      toast.info('Funcionalidade de deleção será implementada em breve');
    }
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return teams.length;
    return teams.filter(team => team.status === status).length;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar equipes</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas equipes e colabore com outros membros
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Equipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Equipe</DialogTitle>
              <DialogDescription>
                Crie uma nova equipe para colaborar com outros usuários em projetos.
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              onSubmit={handleCreateTeam}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">Total de Equipes</span>
          </div>
          <p className="text-2xl font-bold mt-2">{teams.length}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="font-medium">Ativas</span>
          </div>
          <p className="text-2xl font-bold mt-2">{getStatusCount('active')}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="font-medium">Inativas</span>
          </div>
          <p className="text-2xl font-bold mt-2">{getStatusCount('inactive')}</p>
        </div>
        
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="font-medium">Arquivadas</span>
          </div>
          <p className="text-2xl font-bold mt-2">{getStatusCount('archived')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todos os Status
              <Badge variant="secondary" className="ml-2">
                {getStatusCount('all')}
              </Badge>
            </SelectItem>
            <SelectItem value="active">
              Ativas
              <Badge variant="secondary" className="ml-2">
                {getStatusCount('active')}
              </Badge>
            </SelectItem>
            <SelectItem value="inactive">
              Inativas
              <Badge variant="secondary" className="ml-2">
                {getStatusCount('inactive')}
              </Badge>
            </SelectItem>
            <SelectItem value="archived">
              Arquivadas
              <Badge variant="secondary" className="ml-2">
                {getStatusCount('archived')}
              </Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando equipes...</p>
          </div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          {searchQuery || statusFilter !== 'all' ? (
            <div>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou termos de busca
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div>
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma equipe criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira equipe para começar a colaborar com outros usuários
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Equipe
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={handleEditTeam}
              onDelete={handleDeleteTeam}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Results info */}
      {!loading && filteredTeams.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Mostrando {filteredTeams.length} de {teams.length} equipes
          {(searchQuery || statusFilter !== 'all') && (
            <span> (filtradas)</span>
          )}
        </div>
      )}
    </div>
  );
}
