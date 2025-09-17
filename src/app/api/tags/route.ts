import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import type { CreateTagForm } from '@/types'

// GET /api/tags - Listar tags
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
      .from('tags')
      .select('*')
      .order('name')

    if (error) {
      console.error('Erro ao buscar tags:', error)
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
    console.error('Erro ao buscar tags:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST /api/tags - Criar tag
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(cookieStore)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { name, color }: CreateTagForm = await request.json()

    // Validação
    if (!name || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nome é obrigatório'
      }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({
        success: false,
        message: 'Nome deve ter no máximo 100 caracteres'
      }, { status: 400 })
    }

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({
        success: false,
        message: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
      }, { status: 400 })
    }

    // Verificar se já existe uma tag com o mesmo nome
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Já existe uma tag com este nome'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: name.trim(),
        color: color || '#3B82F6' // Cor padrão azul
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tag:', error)
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
    console.error('Erro ao criar tag:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// PUT /api/tags?id=:id - Atualizar tag
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
    const { name, color }: CreateTagForm = await request.json()

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

    if (name.length > 100) {
      return NextResponse.json({
        success: false,
        message: 'Nome deve ter no máximo 100 caracteres'
      }, { status: 400 })
    }

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({
        success: false,
        message: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
      }, { status: 400 })
    }

    // Verificar se a tag existe
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Tag não encontrada'
      }, { status: 404 })
    }

    // Verificar se já existe outra tag com o mesmo nome
    const { data: nameExists } = await supabase
      .from('tags')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (nameExists) {
      return NextResponse.json({
        success: false,
        message: 'Já existe uma tag com este nome'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tags')
      .update({
        name: name.trim(),
        color: color || '#3B82F6',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar tag:', error)
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
    console.error('Erro ao atualizar tag:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// DELETE /api/tags?id=:id - Excluir tag
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

    // Verificar se a tag existe
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({
        success: false,
        message: 'Tag não encontrada'
      }, { status: 404 })
    }

    // Verificar se há projetos usando esta tag
    const { data: projectTags } = await supabase
      .from('project_tags')
      .select('id')
      .eq('tag_id', id)
      .limit(1)

    if (projectTags && projectTags.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Não é possível excluir esta tag pois há projetos associados a ela'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir tag:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Tag excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir tag:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}