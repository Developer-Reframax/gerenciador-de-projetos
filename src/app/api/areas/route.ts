import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Schema de validação para criação de área
const createAreaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().optional()
})

// GET - Listar todas as áreas
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('areas')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filtro de busca por nome
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data: areas, error } = await query

    if (error) {
      console.error('Erro ao buscar áreas:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: areas || []
    })
  } catch (error) {
    console.error('Erro na API de áreas:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova área
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()

    const body = await request.json()
    const validatedData = createAreaSchema.parse(body)

    // Verificar se já existe uma área com o mesmo nome
    const { data: existingArea } = await supabase
      .from('areas')
      .select('id')
      .ilike('name', validatedData.name)
      .single()

    if (existingArea) {
      return NextResponse.json(
        { success: false, message: 'Já existe uma área com este nome' },
        { status: 400 }
      )
    }

    // Criar nova área
    const { data: newArea, error } = await supabase
      .from('areas')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar área:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newArea,
      message: 'Área criada com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Erro ao criar área:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
