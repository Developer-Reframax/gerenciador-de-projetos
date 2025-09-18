import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '../../../lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    // Buscar todos os usuários do sistema para serem stakeholders
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .order('full_name')

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: users || [],
      success: true
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
