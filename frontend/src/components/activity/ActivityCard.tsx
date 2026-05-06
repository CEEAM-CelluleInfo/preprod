import React from 'react';
import { Plus, Users, ChevronRight } from 'lucide-react';

export interface Activity {
  id: string;
  title: string;
  date: string;
  location: string;
  category: 'tous' | 'formations' | 'evenements';
  urgency: 'urgent' | 'normal';
  image?: string;
  registrations?: number;
}

interface ActivityCardProps {
  activity: Activity;
  onJoin?: (activityId: string) => void;
  onViewDetails?: (activityId: string) => void;
}

/**
 * Composant Carte d'Activité
 * Affiche une activité avec image, titre, date/lieu, badge d'urgence et bouton d'inscription
 */
export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onJoin, onViewDetails }) => {
  return (
    <div 
      className="group cursor-pointer overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.09)] sm:p-5"
      onClick={() => onViewDetails?.(activity.id)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-shrink-0">
          {activity.image ? (
            <img
              src={activity.image}
              alt={activity.title}
              className="h-40 w-full rounded-2xl object-cover sm:h-28 sm:w-28 lg:h-32 lg:w-32"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#172d45] via-[#215b8f] to-[#f59f24] sm:h-28 sm:w-28 lg:h-32 lg:w-32">
              <span className="text-3xl font-bold text-white sm:text-2xl">
                {activity.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[#172d45]/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#172d45]">
                  {activity.category === 'formations' ? 'Formation' : 'Événement'}
                </span>
                {activity.urgency === 'urgent' && (
                  <span className="inline-flex rounded-full bg-[#fff4db] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c46b10]">
                    urgent
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-xl font-bold text-[#172d45] sm:text-2xl">
                {activity.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                {activity.date} • {activity.location}
              </p>

              {activity.registrations !== undefined && (
                <div className="mt-3 flex items-center text-sm font-medium text-blue-700">
                  <Users className="mr-1.5 h-4 w-4" />
                  <span>{activity.registrations} inscrits</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.(activity.id);
                }}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Voir les détails"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(activity.id);
                }}
                className="flex h-12 min-w-[8.5rem] items-center justify-center gap-2 rounded-2xl bg-[#f59f24] px-4 text-sm font-semibold text-white transition-all hover:bg-[#e3921f] hover:shadow-lg"
                aria-label="Rejoindre l'activité"
              >
                <Plus className="h-5 w-5" />
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};