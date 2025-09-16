import { NextResponse } from 'next/server'

// GET - Rota de teste simples sem autenticação
export async function GET() {
  try {
    return NextResponse.json({ 
      message: 'API funcionando corretamente',
      timestamp: new Date().toISOString(),
      status: 'success'
    })
  } catch (error) {
    console.error('Erro na rota de teste:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}