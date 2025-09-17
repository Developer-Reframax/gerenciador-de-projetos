import { NextRequest, NextResponse } from 'next/server';
import { getKanbanProjectStatusData } from '../../../../../api/kanban/project-status';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// Interfaces para tipagem
interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface ResponseAdapter {
  status: (code: number) => ResponseAdapter;
  json: (data: unknown) => ResponseAdapter;
  getResponse: () => { statusCode: number; data: ApiResponse };
}

interface RequestWithUser {
  query: Record<string, string | string[]>;
  user: { id: string };
}

// Adapter para converter NextRequest/NextResponse para o formato esperado
function createRequestAdapter(req: NextRequest) {
  const url = new URL(req.url);
  const query: Record<string, string | string[]> = {};
  
  url.searchParams.forEach((value, key) => {
    if (query[key]) {
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value);
      } else {
        query[key] = [query[key] as string, value];
      }
    } else {
      query[key] = value;
    }
  });
  
  return { query };
}

function createResponseAdapter(): ResponseAdapter {
  let statusCode = 200;
  let responseData: ApiResponse | null = null;
  
  const adapter: ResponseAdapter = {
    status: (code: number) => {
      statusCode = code;
      return adapter;
    },
    json: (data: unknown) => {
      responseData = data as ApiResponse;
      return adapter;
    },
    getResponse: () => ({ statusCode, data: responseData || { success: false, error: 'No response data' } })
  };
  
  return adapter;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const cookieStore = await cookies();
  const supabase = createRouteHandlerClient(cookieStore);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Criar adapters
    const reqAdapter = createRequestAdapter(request);
    const resAdapter = createResponseAdapter();
    
    // Adicionar user_id ao request
    const requestWithUser = {
      ...reqAdapter,
      user: { id: user.id }
    };

    // Chamar a função original
    await getKanbanProjectStatusData(requestWithUser as RequestWithUser, resAdapter as ResponseAdapter);
    
    // Obter resposta
    const { statusCode, data } = resAdapter.getResponse();
    
    return NextResponse.json(data, { status: statusCode });
    
  } catch (error) {
    console.error('Erro na rota /api/kanban/project-status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}