import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

type CommentWithProject = {
  projects?: {
    team?: {
      team_members?: Array<{ user_id: string; role: string }>
    }
  }
}

// Schema para validação de atualização de comentário
const updateCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(5000, 'Conteúdo muito longo').optional(),
  is_pinned: z.boolean().optional(),
  is_internal: z.boolean().optional()
})

// GET - Buscar comentário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: projectId, commentId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário tem acesso ao projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        team:teams!inner(
          id,
          team_members!inner(
            user_id
          )
        )
      `)
      .eq('id', projectId)
      .eq('team.team_members.user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado ou acesso negado' },
        { status: 404 }
      )
    }

    // Buscar comentário
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        content_html,
        type,
        context,
        context_id,
        parent_id,
        mentioned_users,
        reactions,
        is_edited,
        is_pinned,
        is_internal,
        created_at,
        updated_at,
        edited_at,
        author:auth.users!author_id(
          id,
          email,
          user_metadata
        ),
        replies:comments!parent_id(
          id,
          content,
          type,
          created_at,
          author:auth.users!author_id(
            id,
            email,
            user_metadata
          )
        )
      `)
      .eq('id', commentId)
      .eq('context', 'project')
      .eq('context_id', projectId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Erro na API de comentário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar comentário
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: projectId, commentId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Validar dados do request
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Debug: Log dos parâmetros recebidos
    console.log('DELETE Comment - Params:', { projectId, commentId, userId: user.id })

    // Primeiro, verificar se o comentário existe
    const { data: commentCheck, error: commentCheckError } = await supabase
      .from('comments')
      .select('id, author_id, context, context_id')
      .eq('id', commentId)
      .single()

    console.log('DELETE Comment - Comment check:', { commentCheck, commentCheckError })

    if (commentCheckError || !commentCheck) {
      console.log('DELETE Comment - Comentário não encontrado na primeira consulta')
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o comentário pertence ao projeto correto
    if (commentCheck.context !== 'project' || commentCheck.context_id !== projectId) {
      console.log('DELETE Comment - Comentário não pertence ao projeto:', {
        commentContext: commentCheck.context,
        commentContextId: commentCheck.context_id,
        expectedProjectId: projectId
      })
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar informações do projeto separadamente
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        team:teams!inner(
          id,
          team_members!inner(
            user_id,
            role
          )
        )
      `)
      .eq('id', projectId)
      .single()

    console.log('DELETE Comment - Project query result:', { project, projectError })

    if (projectError || !project) {
      console.log('DELETE Comment - Projeto não encontrado:', projectError)
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões (autor do comentário ou admin da equipe)
    const isAuthor = commentCheck.author_id === user.id
    const isTeamAdmin = project.team?.team_members?.some(
      (member: { user_id: string; role: string }) => member.user_id === user.id && member.role === 'admin'
    ) || false

    if (!isAuthor && !isTeamAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este comentário' },
        { status: 403 }
      )
    }

    // Preparar dados para atualização
    const updateData: {
      updated_at: string
      content?: string
      is_edited?: boolean
      edited_at?: string
      is_pinned?: boolean
      is_internal?: boolean
    } = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.content) {
      updateData.content = validatedData.content
      updateData.is_edited = true
      updateData.edited_at = new Date().toISOString()
    }

    if (validatedData.is_pinned !== undefined) {
      updateData.is_pinned = validatedData.is_pinned
    }

    if (validatedData.is_internal !== undefined) {
      updateData.is_internal = validatedData.is_internal
    }

    // Atualizar comentário
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', commentId)
      .select(`
        id,
        content,
        content_html,
        type,
        context,
        context_id,
        parent_id,
        mentioned_users,
        reactions,
        is_edited,
        is_pinned,
        is_internal,
        created_at,
        updated_at,
        edited_at,
        author:auth.users!author_id(
          id,
          email,
          user_metadata
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar comentário:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar comentário' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na API de comentário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar comentário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id: projectId, commentId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Debug: Log dos parâmetros recebidos
    console.log('DELETE Comment - Params:', { projectId, commentId, userId: user.id })

    // Primeiro, verificar se o comentário existe
    const { data: commentCheck, error: commentCheckError } = await supabase
      .from('comments')
      .select('id, author_id, context, context_id')
      .eq('id', commentId)
      .single()

    console.log('DELETE Comment - Comment check:', { commentCheck, commentCheckError })

    if (commentCheckError || !commentCheck) {
      console.log('DELETE Comment - Comentário não encontrado na primeira consulta')
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o comentário pertence ao projeto correto
    if (commentCheck.context !== 'project' || commentCheck.context_id !== projectId) {
      console.log('DELETE Comment - Comentário não pertence ao projeto:', {
        commentContext: commentCheck.context,
        commentContextId: commentCheck.context_id,
        expectedProjectId: projectId
      })
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Agora buscar com as informações da equipe
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select(`
        id,
        author_id,
        content,
        context_id,
        projects!inner(
          id,
          team:teams!inner(
            id,
            team_members!inner(
              user_id,
              role
            )
          )
        )
      `)
      .eq('id', commentId)
      .eq('context', 'project')
      .eq('context_id', projectId)
      .single()

    console.log('DELETE Comment - Full query result:', { comment, commentError })

    if (commentError || !comment) {
      console.log('DELETE Comment - Erro na consulta completa:', commentError)
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões (autor do comentário ou admin da equipe)
    const isAuthor = comment.author_id === user.id
    const isTeamAdmin = (comment as CommentWithProject).projects?.team?.team_members?.some(
      (member: { user_id: string; role: string }) => member.user_id === user.id && member.role === 'admin'
    ) || false

    if (!isAuthor && !isTeamAdmin) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este comentário' },
        { status: 403 }
      )
    }

    // Deletar comentário
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (deleteError) {
      console.error('Erro ao deletar comentário:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar comentário' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Comentário deletado com sucesso' })
  } catch (error) {
    console.error('Erro na API de comentário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}