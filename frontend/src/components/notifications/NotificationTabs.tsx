import React from 'react';

export type NotificationTab = 'all' | 'unread' | 'activities' | 'votes' | 'messages' | 'system';

interface Tab {
  id: NotificationTab;
  label: string;
  count?: number;
}

interface NotificationTabsProps {
  activeTab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  tabs: Tab[];
}

/**
 * Composant onglets de filtrage des notifications
 * Permet de filtrer les notifications par catégorie
 */
export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${isActive
                ? 'bg-[#f59f24] text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-[#f59f24] hover:text-[#f59f24]'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};