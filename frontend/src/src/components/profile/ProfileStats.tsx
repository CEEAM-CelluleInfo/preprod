import { STATS_ICONS } from "@/constants/icons.ts";

const ProfileStats = ({ stats }) => {
  const statItems = [
    { key: 'activities', label: 'Activités', icon: STATS_ICONS.activities },
    { key: 'votes', label: 'Votes', icon: STATS_ICONS.votes },
    { key: 'connections', label: 'Connexions', icon: STATS_ICONS.connections },
    { key: 'contributions', label: 'Contributions', icon: STATS_ICONS.contributions }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map(({ key, label, icon: Icon }) => (
        <div key={key} className="bg-card rounded-xl border p-6 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold">{stats[key]}</div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;