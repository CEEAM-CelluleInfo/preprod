import React from 'react';
import { X, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  type: 'system' | 'activity' | 'vote' | 'message';
  title: string;
  description: string;
  timestamp: string;
  isRead?: boolean;
  linkUrl?: string;
  icon?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCardProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

/**
 * Composant carte de notification individuelle
 * Affiche une notification avec titre, description, timestamp et actions
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onDismiss,
}) => {
  // Couleur de l'icône selon le type
  const getIconBgColor = () => {
    switch (notification.type) {
      case 'system':
        return 'bg-blue-100';
      case 'activity':
        return 'bg-purple-100';
      case 'vote':
        return 'bg-green-100';
      case 'message':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow group ${notification.isRead ? 'border-gray-200' : 'border-[#f59f24]/40 bg-[#fffaf2]'}`}>
      <div className="flex items-start gap-4">
        {/* Icône de notification */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${getIconBgColor()} flex items-center justify-center`}>
          {notification.icon || (
            <div className="w-6 h-6 bg-gray-400 rounded" />
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-base ${notification.isRead ? 'text-[#172d45]' : 'text-[#10263d]'}`}>
              {notification.title}
            </h3>
            
            {/* Bouton fermer */}
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.description}
          </p>

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{notification.timestamp}</span>
          </div>

          {/* Bouton d'action optionnel */}
          {notification.actionButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={notification.actionButton.onClick}
              className="mt-3 text-xs"
            >
              {notification.actionButton.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};