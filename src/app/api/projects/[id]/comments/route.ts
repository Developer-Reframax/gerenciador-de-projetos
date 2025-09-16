import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { User } from '@/types/supabase'



// Schema para validação dos dados de comentário
const createCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(5000, 'Conteúdo muito longo'),
  type: z.enum(['comment', 'system', 'mention']).default('comment'),
  parent_id: z.string().uuid().optional(),
  mentioned_users: z.array(z.string().uuid()).default([]),
  is_internal: z.boolean().default(false)
})

// GET - Listar comentários do projeto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Buscar comentários do projeto
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('context_id', projectId)
      .order('created_at', { ascending: false })

    if (commentsError) {
      console.error('Erro ao buscar comentários:', commentsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar dados dos autores
    const authorIds = comments?.map(c => c.user_id).filter(Boolean) || []
    const { data: authors, error: authorsError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .in('id', authorIds)

    if (authorsError) {
      console.error('Erro ao buscar autores:', authorsError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Criar mapa de autores para facilitar a busca
    const authorsMap = new Map(authors?.map(author => [author.id, author]) || [])

    // Transformar os dados para o formato esperado pelo frontend
    const formattedComments = (comments || []).map(comment => {
      const author = authorsMap.get(comment.user_id)
      return {
        ...comment,
        author: {
          id: author?.id,
          email: author?.email,
          user_metadata: {
            full_name: author?.full_name,
            avatar_url: author?.avatar_url
          }
        }
      }
    })

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Erro na API de comentários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo comentário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Validar dados do request
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Criar comentário
    const insertData = {
      content: validatedData.content,
      project_id: projectId,
      user_id: '2638c2e8-d7df-4ddd-8a33-61c3478a7f82' // ID fixo para teste
    }

    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert([insertData])
      .select('*')
      .single()

    if (insertError || !comment) {
      console.error('Erro ao criar comentário:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar comentário' },
        { status: 500 }
      )
    }

    // Buscar dados do autor do comentário criado
    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', comment.user_id)
      .single() as { data: User | null; error: Error | null }

    if (authorError) {
      console.error('Erro ao buscar autor:', authorError)
      return NextResponse.json(
        { error: 'Erro ao buscar dados do autor' },
        { status: 500 }
      )
    }

    // Formatar os dados do comentário criado
    const formattedComment = {
      ...comment,
      author: {
        id: author?.id,
        email: author?.email,
        user_metadata: {
          full_name: author?.full_name,
          avatar_url: author?.avatar_url
        }
      }
    }

    return NextResponse.json({ comment: formattedComment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro na API de comentários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}