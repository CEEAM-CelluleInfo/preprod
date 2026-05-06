/**
 * Service notifications - Connexion au backend Django
 */

import { apiDelete, apiGet, apiPatch, apiPost } from './api.config';

export type NotificationType = 'activity' | 'vote' | 'announcement' | 'message' | 'system';

export interface BackendNotification {
  id: number;
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  link_url: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  this_week: number;
  urgent: number;
  by_type: Record<NotificationType, number>;
}

interface NotificationsResponse {
  notifications: BackendNotification[];
}

interface MarkAllReadResponse {
  success: boolean;
  updated: number;
}

interface MarkReadResponse {
  success: boolean;
  notification: BackendNotification;
}

export class NotificationService {
  static async getNotifications(params?: {
    type?: NotificationType;
    unread?: boolean;
  }): Promise<BackendNotification[]> {
    const searchParams = new URLSearchParams();

    if (params?.type) {
      searchParams.set('type', params.type);
    }

    if (params?.unread !== undefined) {
      searchParams.set('unread', String(params.unread));
    }

    const query = searchParams.toString();
    const endpoint = query ? `/notifications/?${query}` : '/notifications/';

    const response = await apiGet<NotificationsResponse>(endpoint, true);
    return response.notifications;
  }

  static async getStats(): Promise<NotificationStats> {
    return apiGet<NotificationStats>('/notifications/stats/', true);
  }

  static async markAsRead(notificationId: number): Promise<BackendNotification> {
    const response = await apiPatch<MarkReadResponse>(`/notifications/${notificationId}/read/`, {}, true);
    return response.notification;
  }

  static async markAllAsRead(): Promise<MarkAllReadResponse> {
    return apiPost<MarkAllReadResponse>('/notifications/mark-all-read/', {}, true);
  }

  static async deleteNotification(notificationId: number): Promise<boolean> {
    await apiDelete(`/notifications/${notificationId}/`, true);
    return true;
  }
}
