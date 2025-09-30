import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

// Schema para validação de atualização de anexo
const updateAttachmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa').optional()
})

// GET - Obter URL assinada para download do anexo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: workflowId, attachmentId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o workflow existe
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow não encontrado' },
        { status: 404 }
      )
    }

    // Buscar o anexo e verificar se pertence ao workflow
    const { data: attachment, error } = await supabase
      .from('workflow_attachments')
      .select('id, original_filename, file_type, file_path, mime_type, file_size, description')
      .eq('id', attachmentId)
      .eq('workflow_id', workflowId)
      .single()

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Gerar URL assinada para download (válida por 1 hora)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.file_path, 3600)

    if (urlError) {
      console.error('Erro ao gerar URL assinada:', urlError)
      return NextResponse.json(
        { error: 'Erro ao gerar link de download' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      attachment: {
        ...attachment,
        download_url: signedUrl.signedUrl
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar metadados do anexo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: workflowId, attachmentId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validar dados do request
    const body = await request.json()
    const validatedData = updateAttachmentSchema.parse(body)

    // Verificar se o anexo existe e pertence ao usuário
    const { data: attachment, error: attachmentError } = await supabase
      .from('workflow_attachments')
      .select('id, uploaded_by, workflow_id')
      .eq('id', attachmentId)
      .eq('workflow_id', workflowId)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é quem fez o upload
    if (attachment.uploaded_by !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este anexo' },
        { status: 403 }
      )
    }

    // Atualizar anexo
    const { data: updatedAttachment, error: updateError } = await supabase
      .from('workflow_attachments')
      .update({
        description: validatedData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', attachmentId)
      .select(`
        id,
        file_path,
        original_filename,
        file_size,
        mime_type,
        file_type,
        description,
        created_at,
        updated_at,
        uploaded_by,
        users!uploaded_by(full_name, email)
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar anexo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar anexo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Anexo atualizado com sucesso',
      attachment: updatedAttachment 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: workflowId, attachmentId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o anexo e verificar se o usuário pode deletá-lo
    const { data: attachment, error } = await supabase
      .from('workflow_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('workflow_id', workflowId)
      .single()

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Anexo não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é quem fez o upload
    if (attachment.uploaded_by !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este anexo' },
        { status: 403 }
      )
    }

    // Deletar arquivo do storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([attachment.file_path])

    if (storageError) {
      console.error('Erro ao deletar do storage:', storageError)
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo do storage' },
        { status: 500 }
      )
    }

    // Deletar registro do banco
    const { error: deleteError } = await supabase
      .from('workflow_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('workflow_id', workflowId)

    if (deleteError) {
      console.error('Erro ao deletar do banco:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar anexo do banco' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Anexo deletado com sucesso' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}