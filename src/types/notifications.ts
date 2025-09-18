export interface Notification {
  id: string;
  user_id: string;
  message: string;
  status_viewer: boolean;
  status_email: boolean;
  type: NotificationType;
  priority: NotificationPriority;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 
  | 'general'
  | 'welcome'
  | 'project_assignment'
  | 'task_assignment'
  | 'deadline_reminder'
  | 'status_update'
  | 'comment'
  | 'mention'
  | 'system'
  | 'strategic';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationStats {
  period_days: number;
  total_notifications: number;
  unread_notifications: number;
  read_notifications: number;
  email_sent_notifications: number;
  period_notifications: number;
  read_rate: number;
  email_delivery_rate: number;
  notifications_by_type: Record<string, number>;
  notifications_by_priority: Record<string, number>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total_count: number;
  unread_count: number;
}

export interface CreateNotificationRequest {
  user_id: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export interface MarkReadRequest {
  notification_id: string;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
  notification?: Notification;
  count?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (notification: CreateNotificationRequest) => Promise<void>;
  refreshNotifications: () => void;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  showActions?: boolean;
}

export interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export interface NotificationListProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  showActions?: boolean;
  emptyMessage?: string;
}

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Utility types for filtering
export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

// Real-time subscription types
export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification;
  old: Notification;
}

// Webhook payload type for email notifications
export interface EmailNotificationPayload {
  user_email: string;
  user_name: string;
  notifications: {
    id: string;
    message: string;
    type: string;
    priority: string;
    created_at: string;
  }[];
}