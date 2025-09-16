import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Listar anexos do projeto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    const { id: projectId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar anexos do projeto
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select(`
        id,
        url,
        name,
        file_type,
        created_at,
        user_id,
        users!inner(full_name, email)
      `)
      .eq('project_id', projectId)
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
    const { id: projectId } = await params

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `attachments/${projectId}/${fileName}`

    // Upload para o storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    // Salvar informações no banco
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        url: publicUrl,
        name: file.name,
        file_type: file.type || null
      })
      .select()
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