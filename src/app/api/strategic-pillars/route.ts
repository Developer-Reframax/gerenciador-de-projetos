import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import type { CreateStrategicPillarForm } from '@/types'

// GET /api/strategic-pillars - Listar pilares estratégicos
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('strategic_pillars')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erro ao buscar pilares estratégicos:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Erro ao buscar pilares estratégicos:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST /api/strategic-pillars - Criar pilar estratégico
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { name, description }: CreateStrategicPillarForm = await request.json()

    // Validação
    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nome é obrigatório'
      }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({
        success: false,
        message: 'Nome deve ter no máximo 255 caracteres'
      }, { status: 400 })
    }

    if (description && description.length > 1000) {
      return NextResponse.json({
        success: false,
        message: 'Descrição deve ter no máximo 1000 caracteres'
      }, { status: 400 })
    }

    // Verificar se já existe um pilar com o mesmo nome
    const { data: existing } = await supabase
      .from('strategic_pillars')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Já existe um pilar estratégico com este nome'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('strategic_pillars')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar pilar estratégico:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pilar estratégico:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// PUT /api/strategic-pillars?id=:id - Atualizar pilar estratégico
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { name, description }: CreateStrategicPillarForm = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID é obrigatório'
      }, { status: 400 })
    }

    // Validação
    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nome é obrigatório'
      }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({
        success: false,
        message: 'Nome deve ter no máximo 255 caracteres'
      }, { status: 400 })
    }

    if (description && description.length > 1000) {
      return NextResponse.json({
        success: false,
        message: 'Descrição deve ter no máximo 1000 caracteres'
      }, { status: 400 })
    }

    // Verificar se o pilar existe
    const { data: existing } = await supabase
      .from('strategic_pillars')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Pilar estratégico não encontrado'
      }, { status: 404 })
    }

    // Verificar se já existe outro pilar com o mesmo nome
    const { data: nameExists } = await supabase
      .from('strategic_pillars')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (nameExists) {
      return NextResponse.json({
        success: false,
        message: 'Já existe um pilar estratégico com este nome'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('strategic_pillars')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar pilar estratégico:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Erro ao atualizar pilar estratégico:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE /api/strategic-pillars?id=:id - Excluir pilar estratégico
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'ID é obrigatório'
      }, { status: 400 })
    }

    // Verificar se o pilar existe
    const { data: existing } = await supabase
      .from('strategic_pillars')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Pilar estratégico não encontrado'
      }, { status: 404 })
    }

    // Verificar se há projetos usando este pilar
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('strategic_pillar_id', id)
      .limit(1)

    if (projects && projects.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Não é possível excluir este pilar pois há projetos associados a ele'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('strategic_pillars')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir pilar estratégico:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Pilar estratégico excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir pilar estratégico:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}
