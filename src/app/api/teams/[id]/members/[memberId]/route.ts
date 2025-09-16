import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '../../../../../../lib/supabase-server';
import { UpdateTeamMemberData } from '../../../../../../types/team';
import { Json, Database } from '../../../../../../types/database';

interface TeamMemberSoftDelete {
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  deleted_at: string;
  updated_at: string;
}

// PUT /api/teams/[id]/members/[memberId] - Atualizar membro da equipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId, memberId } = await params;
    const body: UpdateTeamMemberData = await request.json();

    // Verificar se o usuário tem permissão para editar membros
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json({ error: 'Equipe não encontrada ou acesso negado' }, { status: 404 });
    }

    // Buscar o membro a ser atualizado
    const { data: targetMember, error: targetError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões baseadas no que está sendo alterado
    const canManageTeam = userMembership.role === 'owner' || userMembership.role === 'admin';
    
    // Não permitir que um membro edite outro membro, exceto se for owner/admin
    if (targetMember.user_id !== user.id && !canManageTeam) {
      return NextResponse.json({ error: 'Sem permissão para editar este membro' }, { status: 403 });
    }

    // Não permitir que alguém edite o owner, exceto o próprio owner
    if (targetMember.role === 'owner' && targetMember.user_id !== user.id) {
      return NextResponse.json({ error: 'Não é possível editar o proprietário da equipe' }, { status: 403 });
    }

    // Não permitir que o owner mude seu próprio papel
    if (targetMember.role === 'owner' && targetMember.user_id === user.id && body.role) {
      return NextResponse.json({ error: 'O proprietário não pode alterar seu próprio papel' }, { status: 403 });
    }

    // Preparar dados para atualização
    const updateData: {
      updated_at: string;
      role?: 'owner' | 'admin' | 'member';
      permissions?: Json;
      status?: 'pending' | 'active' | 'inactive' | 'blocked';
    } = {
      updated_at: new Date().toISOString()
    };

    if (body.role !== undefined && canManageTeam) {
      // Não permitir promover alguém a owner (verificação removida para permitir transferência)
      // if (body.role === 'owner') {
      //   return NextResponse.json({ error: 'Não é possível promover alguém a proprietário' }, { status: 403 });
      // }
      updateData.role = body.role;
    }

    // Permissões removidas - funcionalidade simplificada

    if (body.status !== undefined && canManageTeam) {
      updateData.status = body.status;
    }

    // Atualizar o membro
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
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

    if (updateError) {
      console.error('Erro ao atualizar membro:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
    }

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Erro na API de atualização de membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members/[memberId] - Remover membro da equipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request.cookies);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: teamId, memberId } = await params;

    // Verificar se o usuário tem permissão para remover membros
    const { data: userMembership, error: membershipError } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json({ error: 'Equipe não encontrada ou acesso negado' }, { status: 404 });
    }

    // Buscar o membro a ser removido
    const { data: targetMember, error: targetError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões
    const canManageTeam = userMembership.role === 'owner' || userMembership.role === 'admin';
    
    // Permitir que o próprio usuário saia da equipe (exceto se for owner)
    const isSelfLeaving = targetMember.user_id === user.id;
    
    if (!isSelfLeaving && !canManageTeam) {
      return NextResponse.json({ error: 'Sem permissão para remover este membro' }, { status: 403 });
    }

    // Não permitir remover o owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível remover o proprietário da equipe' }, { status: 403 });
    }

    // Soft delete do membro
    const softDeleteData: TeamMemberSoftDelete = {
      status: 'inactive',
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: deleteError } = await supabase
      .from('team_members')
      .update(softDeleteData as Partial<Database['public']['Tables']['team_members']['Update']>)
      .eq('id', memberId);

    if (deleteError) {
      console.error('Erro ao remover membro:', deleteError);
      return NextResponse.json({ error: 'Erro ao remover membro da equipe' }, { status: 500 });
    }

    const message = isSelfLeaving ? 'Você saiu da equipe com sucesso' : 'Membro removido com sucesso';
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Erro na API de remoção de membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}