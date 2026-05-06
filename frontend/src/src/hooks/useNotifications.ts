import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  NotificationService,
  type BackendNotification,
  type NotificationStats,
} from '@/services/notificationService';

const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationQueryKeys.all, 'list'] as const,
  stats: () => [...notificationQueryKeys.all, 'stats'] as const,
};

const emptyStats: NotificationStats = {
  total: 0,
  unread: 0,
  this_week: 0,
  urgent: 0,
  by_type: {
    activity: 0,
    vote: 0,
    announcement: 0,
    message: 0,
    system: 0,
  },
};

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();

  if (Number.isNaN(diffInMs)) {
    return '';
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffInMs < minute) {
    return "A l'instant";
  }

  if (diffInMs < hour) {
    return `Il y a ${Math.floor(diffInMs / minute)}min`;
  }

  if (diffInMs < day) {
    return `Il y a ${Math.floor(diffInMs / hour)}h`;
  }

  if (diffInMs < 7 * day) {
    return `Il y a ${Math.floor(diffInMs / day)}j`;
  }

  return date.toLocaleDateString('fr-FR');
};

interface UseNotificationsOptions {
  statsOnly?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { statsOnly = false } = options;
  const queryClient = useQueryClient();

  const {
    data: stats = emptyStats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<NotificationStats>({
    queryKey: notificationQueryKeys.stats(),
    queryFn: () => NotificationService.getStats(),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const {
    data: notifications = [],
    isLoading: isListLoading,
    isFetching: isListFetching,
    error: listError,
    refetch: refetchList,
  } = useQuery<BackendNotification[]>({
    queryKey: notificationQueryKeys.list(),
    queryFn: () => NotificationService.getNotifications(),
    enabled: !statsOnly,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const refreshAll = async () => {
    await Promise.all([
      refetchStats(),
      statsOnly ? Promise.resolve() : refetchList(),
    ]);
  };

  const invalidateNotifications = async () => {
    await queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => NotificationService.markAsRead(id),
    onSuccess: invalidateNotifications,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => NotificationService.markAllAsRead(),
    onSuccess: invalidateNotifications,
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => NotificationService.deleteNotification(id),
    onSuccess: invalidateNotifications,
  });

  const markAsRead = async (id: number) => {
    try {
      await markAsReadMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const dismissNotification = async (id: number) => {
    try {
      await dismissMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const unreadCount = useMemo(() => stats.unread, [stats.unread]);

  const notificationsForUi = useMemo(
    () =>
      (notifications as BackendNotification[]).map((item) => ({
        id: String(item.id),
        type: item.type === 'announcement' ? 'system' : item.type,
        title: item.title,
        description: item.message,
        timestamp: formatRelativeTime(item.created_at),
        isRead: item.is_read,
        linkUrl: item.link_url,
      })),
    [notifications]
  );

  const loading = statsOnly
    ? isStatsLoading || isStatsFetching
    : isStatsLoading || isListLoading || isStatsFetching || isListFetching;

  const error = statsError || listError;

  return {
    notifications,
    notificationsForUi,
    stats,
    unreadCount,
    loading,
    error: error ? 'Erreur lors du chargement des notifications' : null,
    refresh: refreshAll,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
};
