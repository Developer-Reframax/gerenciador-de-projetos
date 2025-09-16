import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../lib/supabase-server';
import { UpdateTeamData, TeamSettings } from '../../../../types/team';
import { Database, Json } from '../../../../types/database';

// GET /api/teams/[id] - Buscar equipe específica com membros
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request.cookies);
    
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

    // Buscar dados da equipe
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Equipe não encontrada' }, { status: 404 });
    }

    // Buscar membros da equipe
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        *,
        user:users(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Erro ao buscar membros:', membersError);
      return NextResponse.json({ error: 'Erro ao buscar membros da equipe' }, { status: 500 });
    }

    const teamWithMembers = {
      ...team,
      members: members || [],
      member_count: members?.length || 0,
      user_role: (membership as unknown as { role: string }).role
    };

    return NextResponse.json({ team: teamWithMembers });
  } catch (error) {
    console.error('Erro na API de equipe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT /api/teams/[id] - Atualizar equipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request.cookies);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const body: UpdateTeamData = await request.json();

    // Verificar se o usuário tem permissão para editar a equipe
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

    // Verificar permissões (apenas owner e admin com can_manage_team podem editar)
    const canManageTeam = (membership as unknown as { role: string }).role === 'owner' || (membership as unknown as { role: string }).role === 'admin';
    
    if (!canManageTeam) {
      return NextResponse.json({ error: 'Sem permissão para editar esta equipe' }, { status: 403 });
    }

    // Preparar dados para atualização
    const updateData: {
      updated_at: string;
      name?: string;
      description?: string;
      settings?: Partial<TeamSettings>;
      color?: string;
      avatar_url?: string;
      is_active?: boolean;
    } = {
      updated_at: new Date().toISOString()
    };

    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Nome da equipe é obrigatório' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || undefined;
    }

    if (body.color !== undefined) {
      updateData.color = body.color;
    }

    if (body.avatar_url !== undefined) {
      updateData.avatar_url = body.avatar_url;
    }

    if (body.settings !== undefined) {
      // Mesclar configurações existentes com as novas
      const { data: currentTeam } = await supabase
        .from('teams')
        .select('settings')
        .eq('id', teamId)
        .single();
      
      updateData.settings = {
        ...(typeof (currentTeam as { settings?: Json })?.settings === 'object' && (currentTeam as { settings?: Json })?.settings !== null ? (currentTeam as { settings?: Json }).settings as Record<string, unknown> : {}),
        ...body.settings
      };
    }

    if (body.is_active !== undefined && (membership as unknown as { role: string }).role === 'owner') {
      updateData.is_active = body.is_active;
    }

    // Atualizar a equipe
    const { data: team, error: updateError } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar equipe:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar equipe' }, { status: 500 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Erro na API de atualização de equipe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/teams/[id] - Deletar equipe (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request.cookies);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Verificar se o usuário é o owner da equipe
    const { data: membership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership || (membership as unknown as { role: string }).role !== 'owner') {
      return NextResponse.json({ error: 'Apenas o proprietário pode deletar a equipe' }, { status: 403 });
    }

    // Soft delete da equipe
    const { error: deleteError } = await supabase
      .from('teams')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (deleteError) {
      console.error('Erro ao deletar equipe:', deleteError);
      return NextResponse.json({ error: 'Erro ao deletar equipe' }, { status: 500 });
    }

    // Soft delete de todos os membros
    const { error: membersDeleteError } = await supabase
      .from('team_members')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Partial<Database['public']['Tables']['team_members']['Update']>)
      .eq('team_id', teamId);

    if (membersDeleteError) {
      console.error('Erro ao remover membros da equipe:', membersDeleteError);
    }

    return NextResponse.json({ message: 'Equipe deletada com sucesso' });
  } catch (error) {
    console.error('Erro na API de deleção de equipe:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}