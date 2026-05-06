import React, { useMemo, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { HeaderConnected } from '@/components/layout/HeaderConnected';
import Footer from '@/components/layout/Footer';
import { StatCard } from '@/components/notifications/StatCard';
import { NotificationTabs, NotificationTab } from '@/components/notifications/NotificationTabs';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Button } from '@/components/ui/button';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Page Notifications connectee au backend
 */
export const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const {
    notificationsForUi,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  const tabs = useMemo(
    () => [
      { id: 'all' as NotificationTab, label: 'Toutes', count: stats.total },
      { id: 'unread' as NotificationTab, label: 'Non lues', count: stats.unread },
      { id: 'activities' as NotificationTab, label: 'Activites', count: stats.by_type.activity },
      { id: 'votes' as NotificationTab, label: 'Votes', count: stats.by_type.vote },
      { id: 'messages' as NotificationTab, label: 'Messages', count: stats.by_type.message },
      { id: 'system' as NotificationTab, label: 'Systeme', count: stats.by_type.system + stats.by_type.announcement },
    ],
    [stats]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return notificationsForUi;
    }

    return notificationsForUi.filter((n) => {
      if (activeTab === 'unread') return !n.isRead;
      if (activeTab === 'activities') return n.type === 'activity';
      if (activeTab === 'votes') return n.type === 'vote';
      if (activeTab === 'messages') return n.type === 'message';
      if (activeTab === 'system') return n.type === 'system';
      return true;
    });
  }, [activeTab, notificationsForUi]);

  const handleDismiss = async (id: string) => {
    const parsedId = Number(id);
    if (!Number.isNaN(parsedId)) {
      await dismissNotification(parsedId);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderConnected />

      <header className="bg-[#172d45] text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-white/80 text-sm">
            Restez informe de toutes les activites importantes
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard value={stats.total} label="Total" />
          <StatCard value={stats.unread} label="Non lues" variant="primary" />
          <StatCard value={stats.this_week} label="Cette semaine" />
          <StatCard value={stats.urgent} label="Urgentes" variant="warning" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-[#172d45]">Toutes les notifications</h2>
            <Button
              onClick={handleMarkAllAsRead}
              className="bg-[#f59f24] hover:bg-[#f59f24]/90 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          </div>

          <NotificationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />

          {loading && (
            <p className="text-gray-500 py-6">Chargement des notifications...</p>
          )}

          {error && !loading && (
            <p className="text-red-600 py-6">{error}</p>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={{
                      ...notification,
                      actionButton: !notification.isRead
                        ? {
                            label: 'Marquer comme lu',
                            onClick: () => {
                              const parsedId = Number(notification.id);
                              if (!Number.isNaN(parsedId)) {
                                markAsRead(parsedId);
                              }
                            },
                          }
                        : undefined,
                    }}
                    onDismiss={handleDismiss}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune notification dans cette categorie</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
