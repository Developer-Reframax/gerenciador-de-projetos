import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '../../../../../lib/supabase-server';
import { AddTeamMemberData } from '../../../../../types/team';

interface TeamMemberWithStatus {
  id: string;
  status: string;
}

interface TeamSettings {
  require_approval_for_members?: boolean;
}

interface TeamWithSettings {
  settings: TeamSettings | null;
}

// GET /api/teams/[id]/members - Listar membros da equipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Verificar se o usuário é membro da equipe
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role, status')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Equipe não encontrada ou acesso negado' }, { status: 404 });
    }

    // Buscar membros da equipe (incluindo inativos)
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .in('status', ['active', 'pending', 'inactive'])
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Erro ao buscar membros:', membersError);
      return NextResponse.json({ error: 'Erro ao buscar membros da equipe' }, { status: 500 });
    }

    // Buscar dados dos usuários separadamente
    const userIds = teamMembers?.map(member => member.user_id) || [];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return NextResponse.json({ error: 'Erro ao buscar dados dos usuários' }, { status: 500 });
    }

    // Combinar os dados
    const members = teamMembers?.map(member => {
      const user = users?.find(u => u.id === member.user_id);
      return {
        ...member,
        user: user || null
      };
    }) || [];

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Erro na API de membros:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/teams/[id]/members - Adicionar membro à equipe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body: AddTeamMemberData = await request.json();

    // Validar dados obrigatórios
    if (!body.user_id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para adicionar membros
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Equipe não encontrada ou acesso negado' }, { status: 404 });
    }

    // Verificar permissões
    const canInvite = membership.role === 'owner' || membership.role === 'admin';
    
    if (!canInvite) {
      return NextResponse.json({ error: 'Sem permissão para adicionar membros' }, { status: 403 });
    }

    // Verificar se o usuário a ser adicionado existe
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', body.user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário já é membro da equipe
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id, status')
      .eq('team_id', teamId)
      .eq('user_id', body.user_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingMember) {
      const memberWithStatus = existingMember as unknown as TeamMemberWithStatus;
      if (memberWithStatus.status === 'active') {
        return NextResponse.json({ error: 'Usuário já é membro desta equipe' }, { status: 400 });
      } else if (memberWithStatus.status === 'pending') {
        return NextResponse.json({ error: 'Usuário já tem um convite pendente' }, { status: 400 });
      }
    }

    // Buscar configurações da equipe para verificar se precisa de aprovação
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('settings')
      .eq('id', teamId)
      .single();

    if (teamError) {
      return NextResponse.json({ error: 'Erro ao buscar configurações da equipe' }, { status: 500 });
    }

    const teamWithSettings = team as unknown as TeamWithSettings;
    const requiresApproval = teamWithSettings?.settings?.require_approval_for_members ?? true;
    const memberStatus = requiresApproval ? 'pending' : 'active';

    // Adicionar membro à equipe
    const { data: newMember, error: addError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: body.user_id,
        role: body.role || 'member',
        status: memberStatus,
        invited_by: user.id,
        // Permissões removidas - funcionalidade simplificada
      })
      .select(`
        *,
        user:users(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (addError) {
      console.error('Erro ao adicionar membro:', addError);
      return NextResponse.json({ error: 'Erro ao adicionar membro à equipe' }, { status: 500 });
    }

    return NextResponse.json({ 
      member: newMember,
      message: requiresApproval ? 'Convite enviado com sucesso' : 'Membro adicionado com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na API de adição de membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}