import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // dias
    const periodDays = parseInt(period);

    // Data de início do período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Buscar estatísticas gerais do usuário
    const { data: totalNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status_viewer', false);

    const { data: emailSentNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status_email', true);

    // Buscar notificações do período
    const { data: periodNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Buscar notificações por tipo
    const { data: notificationsByType } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Agrupar por tipo
    const typeStats = notificationsByType?.reduce((acc: Record<string, number>, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Buscar notificações por prioridade
    const { data: notificationsByPriority } = await supabase
      .from('notifications')
      .select('priority')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Agrupar por prioridade
    const priorityStats = notificationsByPriority?.reduce((acc: Record<string, number>, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calcular taxa de leitura
    const totalCount = totalNotifications?.length || 0;
    const unreadCount = unreadNotifications?.length || 0;
    const readCount = totalCount - unreadCount;
    const readRate = totalCount > 0 ? (readCount / totalCount) * 100 : 0;

    // Calcular taxa de envio de email
    const emailSentCount = emailSentNotifications?.length || 0;
    const emailRate = totalCount > 0 ? (emailSentCount / totalCount) * 100 : 0;

    return NextResponse.json({
      period_days: periodDays,
      total_notifications: totalCount,
      unread_notifications: unreadCount,
      read_notifications: readCount,
      email_sent_notifications: emailSentCount,
      period_notifications: periodNotifications?.length || 0,
      read_rate: Math.round(readRate * 100) / 100,
      email_delivery_rate: Math.round(emailRate * 100) / 100,
      notifications_by_type: typeStats,
      notifications_by_priority: priorityStats
    });

  } catch (error) {
    console.error('Error in notifications stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}