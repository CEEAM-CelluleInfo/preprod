import React from 'react';

export type ActivityTab = 'tous' | 'formations' | 'evenements';

interface Tab {
  id: ActivityTab;
  label: string;
}

interface ActivityTabsProps {
  activeTab: ActivityTab;
  onTabChange: (tab: ActivityTab) => void;
}

/**
 * Composant Onglets de Filtrage des Activités
 * Permet de filtrer entre Tous, Formations et Événements
 */
export const ActivityTabs: React.FC<ActivityTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: Tab[] = [
    { id: 'tous', label: 'Tous' },
    { id: 'formations', label: 'Formations' },
    { id: 'evenements', label: 'Évènements' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-6 py-3 rounded-xl font-semibold text-base transition-all
              ${
                isActive
                  ? 'bg-[#f59f24] text-white shadow-md'
                  : 'bg-white text-gray-700 border-2 border-[#f59f24] hover:bg-[#f59f24]/10'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};