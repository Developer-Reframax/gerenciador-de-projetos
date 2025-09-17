import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { z } from 'zod'

const updateAreaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional()
})

// GET - Obter área específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: area, error } = await supabase
      .from('areas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Área não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar área:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: area
    })
  } catch (error) {
    console.error('Erro ao buscar área:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar área
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAreaSchema.parse(body)

    // Verificar se a área existe
    const { data: existingArea } = await supabase
      .from('areas')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingArea) {
      return NextResponse.json(
        { success: false, message: 'Área não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe outra área com o mesmo nome
    const { data: duplicateArea } = await supabase
      .from('areas')
      .select('id')
      .ilike('name', validatedData.name)
      .neq('id', id)
      .single()

    if (duplicateArea) {
      return NextResponse.json(
        { success: false, message: 'Já existe uma área com este nome' },
        { status: 400 }
      )
    }

    // Atualizar área
    const { data: updatedArea, error } = await supabase
      .from('areas')
      .update({
        name: validatedData.name,
        description: validatedData.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar área:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedArea,
      message: 'Área atualizada com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar área:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir área
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se a área existe
    const { data: existingArea } = await supabase
      .from('areas')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingArea) {
      return NextResponse.json(
        { success: false, message: 'Área não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a área está sendo usada em projetos
    const { data: projectAreas } = await supabase
      .from('project_areas')
      .select('id')
      .eq('area_id', id)
      .limit(1)

    if (projectAreas && projectAreas.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Não é possível excluir uma área que está sendo usada em projetos' },
        { status: 400 }
      )
    }

    // Excluir área
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir área:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Área excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir área:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}