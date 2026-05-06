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
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails?.(activity.id)}
    >
      <div className="flex gap-4">
        {/* Image de l'activité */}
        <div className="flex-shrink-0">
          {activity.image ? (
            <img
              src={activity.image}
              alt={activity.title}
              className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {activity.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#172d45] mb-2">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-600">
                {activity.date} • {activity.location}
              </p>
              {/* Nombre d'inscrits */}
              {activity.registrations !== undefined && (
                <div className="flex items-center mt-1 text-sm text-blue-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{activity.registrations} inscrits</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton voir détails */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.(activity.id);
                }}
                className="flex-shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Voir les détails"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Bouton d'inscription */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin?.(activity.id);
                }}
                className="flex-shrink-0 w-12 h-12 bg-[#f59f24] hover:bg-[#f59f24]/90 text-white rounded-xl flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
                aria-label="Rejoindre l'activité"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Badge d'urgence */}
          {activity.urgency === 'urgent' && (
            <div className="mt-3">
              <span className="inline-block bg-[#f59f24] text-white text-xs font-semibold px-4 py-1.5 rounded-md">
                urgent
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};