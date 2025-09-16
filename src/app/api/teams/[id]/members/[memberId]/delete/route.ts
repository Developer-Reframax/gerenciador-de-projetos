import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '../../../../../../../lib/supabase-server';

// DELETE /api/teams/[id]/members/[memberId]/delete - Remover membro definitivamente
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

    // Verificar permissões - apenas owner ou admin podem remover definitivamente
    const canManageTeam = userMembership.role === 'owner' || userMembership.role === 'admin';
    
    if (!canManageTeam) {
      return NextResponse.json({ error: 'Sem permissão para remover definitivamente este membro' }, { status: 403 });
    }

    // Não permitir remover o owner
    if (targetMember.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível remover o proprietário da equipe' }, { status: 403 });
    }

    // Remoção definitiva do membro
    const { error: deleteError } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Erro ao remover membro definitivamente:', deleteError);
      return NextResponse.json({ error: 'Erro ao remover membro definitivamente da equipe' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Membro removido definitivamente com sucesso' });
  } catch (error) {
    console.error('Erro na API de remoção definitiva de membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}