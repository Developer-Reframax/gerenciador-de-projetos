import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { EquipesResponse } from '@/types/kanban'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient(await cookies())

    // Buscar todas as equipes
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, description')
      .order('name')

    if (error) {
      console.error('Erro ao buscar equipes:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const response: EquipesResponse = {
      equipes: (teams || []).map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || undefined
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro na API equipes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}