import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

// GET - Listar usuários para seleção de stakeholders
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filtro de busca por nome ou email
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Contar total de usuários para paginação
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Erro ao contar usuários:', countError)
      return NextResponse.json(
        { success: false, message: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    })
  } catch (error) {
    console.error('Erro na API de usuários:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}