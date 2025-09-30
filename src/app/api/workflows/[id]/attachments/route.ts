import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Listar anexos do workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: workflowId } = await params

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

    // Buscar anexos do workflow
    const { data: attachments, error } = await supabase
      .from('workflow_attachments')
      .select(`
        id,
        file_path,
        filename,
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
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar anexos:', error)
      return NextResponse.json({ error: 'Erro ao buscar anexos' }, { status: 500 })
    }

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Upload de anexo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: workflowId } = await params

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
    }

    // Validar tamanho do arquivo (10MB máximo)
    if (file.size > 10485760) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `workflow-attachments/${workflowId}/${fileName}`

    // Upload para o storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
    }

    // Determinar tipo de arquivo baseado no MIME type
    const getFileType = (mimeType: string): string => {
      if (mimeType.startsWith('image/')) return 'image'
      if (mimeType.startsWith('video/')) return 'video'
      if (mimeType.startsWith('audio/')) return 'audio'
      if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
      if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) return 'code'
      return 'other'
    }

    // Salvar informações no banco
    const { data: attachment, error: dbError } = await supabase
      .from('workflow_attachments')
      .insert({
        workflow_id: workflowId,
        uploaded_by: user.id,
        filename: fileName,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        file_type: getFileType(file.type || 'application/octet-stream'),
        description: description.trim()
      })
      .select(`
        id,
        file_path,
        filename,
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

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      // Tentar remover arquivo do storage se falhou no banco
      await supabase.storage.from('attachments').remove([filePath])
      return NextResponse.json({ error: 'Erro ao salvar informações do arquivo' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Arquivo enviado com sucesso',
      attachment 
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}