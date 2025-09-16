import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Schema de validação para as datas
const updateDatesSchema = z.object({
  start_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable()
}).refine(
  (data) => {
    // Se ambas as datas estão presentes, start_date deve ser anterior a due_date
    if (data.start_date && data.due_date) {
      return new Date(data.start_date) <= new Date(data.due_date);
    }
    return true;
  },
  {
    message: "A data de início deve ser anterior à data de entrega",
    path: ["start_date"]
  }
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      );
    }

    // Validar dados de entrada
    const body = await request.json();
    const validationResult = updateDatesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { start_date, due_date } = validationResult.data;

    // Verificar se o usuário tem permissão para editar o projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        owner_id,
        team_id,
        teams!inner(
          id,
          team_members!inner(
            user_id
          )
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões: owner do projeto ou membro da equipe
    const isOwner = project.owner_id === user.id;
    const isTeamMember = project.teams?.team_members?.some(
      (member: { user_id: string }) => member.user_id === user.id
    );

    if (!isOwner && !isTeamMember) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este projeto' },
        { status: 403 }
      );
    }

    // Preparar dados para atualização (apenas campos não undefined)
    const updateData: { start_date?: string | null; due_date?: string | null; updated_at?: string } = {
      updated_at: new Date().toISOString()
    };
    if (start_date !== undefined) updateData.start_date = start_date;
    if (due_date !== undefined) updateData.due_date = due_date;

    // Atualizar o projeto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        id,
        name,
        description,
        status,
        priority,
        start_date,
        due_date,
        progress_percentage,
        owner_id,
        team_id,
        created_at,
        updated_at,
        users!inner(
          id,
          full_name,
          email
        ),
        teams(
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Erro ao atualizar projeto:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar projeto' },
        { status: 500 }
      );
    }

    // Transformar dados para o formato esperado
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      status: updatedProject.status,
      priority: updatedProject.priority,
      start_date: updatedProject.start_date,
      due_date: updatedProject.due_date,
      progress_percentage: updatedProject.progress_percentage || 0,
      owner: {
        id: updatedProject.users.id,
        full_name: updatedProject.users.full_name,
        email: updatedProject.users.email
      },
      team: updatedProject.teams ? {
        id: updatedProject.teams.id,
        name: updatedProject.teams.name
      } : null,
      created_at: updatedProject.created_at,
      updated_at: updatedProject.updated_at
    };

    return NextResponse.json({
      success: true,
      project: transformedProject
    });

  } catch (error) {
    console.error('Erro na API de atualização de datas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}