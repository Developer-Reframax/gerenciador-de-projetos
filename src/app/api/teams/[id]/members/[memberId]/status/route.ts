import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../../../../lib/supabase-server';
import { Database } from '../../../../../../../types/database';

interface TeamMemberStatusUpdate {
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  updated_at: string;
  deleted_at?: string | null;
}

// PATCH /api/teams/[id]/members/[memberId]/status - Alterar status do membro (ativar/inativar)
export async function PATCH(
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
    const { status } = await request.json();

    // Validar status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido. Use "active" ou "inactive"' }, { status: 400 });
    }

    // Verificar se o usuário tem permissão para alterar status de membros
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

    // Buscar o membro a ser alterado
    const { data: targetMember, error: targetError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .eq('team_id', teamId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    // Verificar permissões - apenas owner ou admin com permissão podem alterar status
    const canManageTeam = userMembership.role === 'owner' || userMembership.role === 'admin';
    
    if (!canManageTeam) {
      return NextResponse.json({ error: 'Sem permissão para alterar status deste membro' }, { status: 403 });
    }

    // Não permitir alterar status do owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível alterar o status do proprietário da equipe' }, { status: 403 });
    }

    // Alterar status do membro
    const updateData: TeamMemberStatusUpdate = {
      status,
      updated_at: new Date().toISOString()
    };

    // Se estiver inativando, definir deleted_at
    if (status === 'inactive') {
      updateData.deleted_at = new Date().toISOString();
    } else {
      // Se estiver ativando, limpar deleted_at
      updateData.deleted_at = null;
    }

    const { error: updateError } = await supabase
      .from('team_members')
      .update(updateData as Partial<Database['public']['Tables']['team_members']['Update']>)
      .eq('id', memberId);

    if (updateError) {
      console.error('Erro ao alterar status do membro:', updateError);
      return NextResponse.json({ error: 'Erro ao alterar status do membro' }, { status: 500 });
    }

    const message = status === 'active' ? 'Membro ativado com sucesso' : 'Membro inativado com sucesso';
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Erro na API de alteração de status de membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}