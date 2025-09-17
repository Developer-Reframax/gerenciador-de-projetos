import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// GET - Obter URL assinada para download do anexo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    const { id: projectId, attachmentId } = await params;

    // Verificar se o usuário tem acesso ao projeto
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o anexo e verificar se pertence ao projeto
    const { data: attachment, error } = await supabase
      .from('attachments')
      .select('id, filename, file_type, file_path')
      .eq('id', attachmentId)
      .eq('project_id', projectId)
      .single();

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Gerar URL assinada para download (válida por 1 hora)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.file_path, 3600);

    if (urlError) {
      console.error('Erro ao gerar URL assinada:', urlError);
      return NextResponse.json(
        { error: 'Erro ao gerar link de download' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attachment: {
        ...attachment,
        download_url: signedUrl.signedUrl
      }
    });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    const { id: projectId, attachmentId } = await params;

    // Verificar se o usuário tem acesso ao projeto
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o anexo e verificar se o usuário pode deletá-lo
    const { data: attachment, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('project_id', projectId)
      .single();

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      );
    }

    // Qualquer usuário autenticado pode deletar anexos

    // Deletar arquivo do storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Erro ao deletar do storage:', storageError);
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo do storage' },
        { status: 500 }
      );
    }

    // Deletar registro do banco
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Erro ao deletar do banco:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar anexo do banco' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Anexo deletado com sucesso' });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}