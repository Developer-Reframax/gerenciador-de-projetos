import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '../../../lib/supabase-server';
import { CreateTeamData } from '../../../types/team';

// GET /api/teams - Listar todas as equipes do usuário
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Primeiro, buscar IDs das equipes onde o usuário é membro
    const { data: userTeams, error: userTeamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (userTeamsError) {
      console.error('Erro ao buscar equipes do usuário:', userTeamsError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    if (!userTeams || userTeams.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    const teamIds = userTeams.map(ut => ut.team_id);

    // Buscar dados das equipes
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar equipes:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Buscar TODOS os membros ativos de cada equipe
    const { data: allMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        role,
        status,
        user_id,
        team_id
      `)
      .in('team_id', teamIds)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (membersError) {
      console.error('Erro ao buscar membros das equipes:', membersError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Agrupar membros por equipe
    const membersByTeam = allMembers?.reduce((acc, member) => {
      if (!acc[member.team_id]) {
        acc[member.team_id] = [];
      }
      acc[member.team_id].push(member);
      return acc;
    }, {} as Record<string, typeof allMembers>) || {};

    // Combinar dados das equipes com seus membros
    const teamsWithMembers = teams?.map(team => ({
      ...team,
      team_members: membersByTeam[team.id] || []
    })) || [];

    return NextResponse.json({
      teams: teamsWithMembers,
      total: teamsWithMembers.length
    });
  } catch (error) {
    console.error('Erro na API de equipes:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/teams - Criar nova equipe
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: CreateTeamData = await request.json();
    
    // Validar dados obrigatórios
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da equipe é obrigatório' }, { status: 400 });
    }

    // Criar a equipe
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        owner_id: user.id,
        settings: {
          allow_public_projects: false,
          allow_external_sharing: false,
          default_project_visibility: 'team',
          require_approval_for_members: true,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar equipe:', error);
      return NextResponse.json({ error: 'Erro ao criar equipe' }, { status: 500 });
    }

    // Adicionar o criador como owner da equipe
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        // Permissões removidas - funcionalidade simplificada
      });

    if (memberError) {
      console.error('Erro ao adicionar owner à equipe:', memberError);
      // Tentar deletar a equipe criada se falhar ao adicionar o owner
      await supabase.from('teams').delete().eq('id', team.id);
      return NextResponse.json({ error: 'Erro ao criar equipe' }, { status: 500 });
    }

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Erro na API de criação de equipe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
