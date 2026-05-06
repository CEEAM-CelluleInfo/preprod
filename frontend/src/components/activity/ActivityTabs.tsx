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
    <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-semibold transition-all sm:px-6 sm:text-base
              ${
                isActive
                  ? 'bg-[#172d45] text-white shadow-[0_10px_24px_rgba(23,45,69,0.16)]'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-[#f59f24]/50 hover:bg-[#fff7ed]'
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