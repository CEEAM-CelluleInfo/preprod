/**
 * Types TypeScript pour le module Activités
 */

/**
 * Catégorie d'activité
 */
export type ActivityCategory = 'tous' | 'formations' | 'evenements';

/**
 * Niveau d'urgence d'une activité
 */
export type ActivityUrgency = 'urgent' | 'normal';

/**
 * Onglet de filtrage des activités
 */
export type ActivityTab = 'tous' | 'formations' | 'evenements';

/**
 * Structure d'une activité
 */
export interface Activity {
  /** Identifiant unique de l'activité */
  id: string;

  /** Titre de l'activité */
  title: string;

  /** Description détaillée */
  description?: string;

  /** Date de l'activité (format texte) */
  date: string;

  /** Lieu de l'activité */
  location: string;

  /** Catégorie de l'activité */
  category: ActivityCategory;

  /** Niveau d'urgence */
  urgency: ActivityUrgency;

  /** URL de l'image de l'activité */
  image?: string;

  /** Nombre maximum de participants */
  maxParticipants?: number;

  /** Nombre actuel de participants */
  currentParticipants?: number;

  /** Date limite d'inscription (timestamp) */
  registrationDeadline?: string;

  /** Organisateur de l'activité */
  organizer?: {
    name: string;
    avatar?: string;
  };

  /** Tags/mots-clés */
  tags?: string[];
}

/**
 * Configuration d'un onglet de filtrage
 */
export interface ActivityTabConfig {
  /** Identifiant de l'onglet */
  id: ActivityTab;

  /** Label affiché */
  label: string;

  /** Icône (optionnelle) */
  icon?: React.ReactNode;
}

/**
 * Props pour le composant ActivityCard
 */
export interface ActivityCardProps {
  /** Données de l'activité */
  activity: Activity;

  /** Callback lors de l'inscription */
  onJoin?: (activityId: string) => void;

  /** Callback lors du clic sur la carte */
  onClick?: (activityId: string) => void;
}

/**
 * Props pour le composant ActivityTabs
 */
export interface ActivityTabsProps {
  /** Onglet actuellement actif */
  activeTab: ActivityTab;

  /** Callback lors du changement d'onglet */
  onTabChange: (tab: ActivityTab) => void;

  /** Configuration des onglets (optionnel) */
  tabs?: ActivityTabConfig[];
}

/**
 * Props pour le composant Calendar
 */
export interface CalendarProps {
  /** Callback lors de la sélection d'une date */
  onDateSelect?: (date: Date) => void;

  /** Date actuellement sélectionnée */
  selectedDate?: Date;

  /** Jours avec des activités (pour afficher les points) */
  daysWithActivities?: number[];

  /** Mois affiché (par défaut: mois actuel) */
  displayedMonth?: Date;
}

/**
 * Filtre de recherche d'activités
 */
export interface ActivityFilter {
  /** Catégorie */
  category?: ActivityCategory;

  /** Urgence */
  urgency?: ActivityUrgency;

  /** Date minimum */
  dateFrom?: Date;

  /** Date maximum */
  dateTo?: Date;

  /** Recherche textuelle */
  searchQuery?: string;

  /** Tags */
  tags?: string[];
}

/**
 * Paramètres de pagination
 */
export interface PaginationParams {
  /** Page actuelle (1-indexed) */
  currentPage: number;

  /** Nombre d'éléments par page */
  itemsPerPage: number;

  /** Nombre total d'éléments */
  totalItems: number;
}