/**
 * Types pour les activités - Compatible Django API
 */

// Catégories d'activités (match Django CATEGORY_CHOICES)
export type ActivityCategory = 'integration' | 'formation' | 'culture' | 'networking' | 'sport';
export type ActivityTabCategory = 'tous' | 'formations' | 'evenements';

export interface ActivityOrganizer {
  name: string;
  avatar?: string;
}

export interface Conference {
  id: number;
  title: string;
  subtitle: string;
  images?: string[];
  href: string;
}

export interface RegistrationPayload {
  nomComplet: string;
  email: string;
  telephone: string;
  niveauEtude: 'Bac' | 'Bac+2' | 'Bac+3 (Licence)' | 'Bac+5 (Master)' | 'Doctorat' | 'Autre';
}

export interface ActivityLikeStatus {
  activityId: string;
  likesCount: number;
  userLiked: boolean;
}

export interface ActivityStarResponse {
  stars: number;
  isStarred: boolean;
}

export interface UpcomingEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
}

export interface ActivitiesApiResponse {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
  daysWithActivities?: number[];
}

export interface UpcomingEventsApiResponse {
  data: UpcomingEvent[];
  total: number;
}

export interface ActivityCategoriesResponse {
  categories: string[];
}

export interface RegistrationSuccessResponse {
  success: boolean;
  message: string;
  data: {
    registrationId: string;
    activityId: string;
    nomComplet: string;
    email: string;
    registeredAt: string;
  };
}

/**
 * Interface Activity correspondant au modèle Django Activity
 */
export interface Activity {
  id: number;
  title: string;
  description: string;
  long_description?: string;
  category: ActivityCategory | ActivityTabCategory | string;
  image_url?: string;
  event_date?: string; // ISO datetime string
  event_time?: string;
  location?: string;
  duration?: string;
  max_participants?: number;
  registration_deadline?: string;
  organizer_name?: string;
  organizer_avatar?: string;
  tags?: string[];
  is_upcoming?: boolean;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  
  // Propriétés calculées (incluses dans le serializer)
  likes_count: number;
  registrations_count?: number;
  user_liked?: boolean;     // Pour l'utilisateur connecté
  user_registered?: boolean; // Pour l'utilisateur connecté
  stars?: number;
  isUpcoming?: boolean;
  categoryLabel?: string;
  categoryTab?: ActivityTabCategory;
  urgency?: 'urgent' | 'normal';
  conferences?: Conference[];
  likesCount?: number;
  organizer?: ActivityOrganizer;
  currentParticipants?: number;
  maxParticipants?: number;
  registrationDeadline?: string;
  
  // Alias pour compatibilité avec l'ancien code frontend
  longDescription?: string; // Alias pour long_description
  imageUrl?: string; // Alias pour image_url
  image?: string; // Alias pour image_url
  date?: string; // Alias formaté pour event_date
  time?: string; // Alias pour event_time
  participants?: number; // Alias pour registrations_count
  upcoming?: boolean; // Alias pour is_upcoming
  likes?: number; // Alias pour likes_count
  userLiked?: boolean; // Alias pour user_liked
}

/**
 * Données pour créer/modifier une activité
 */
export interface ActivityCreateData {
  title: string;
  description: string;
  long_description?: string;
  category: ActivityCategory;
  image_url?: string;
  event_date?: string;
  event_time?: string;
  location?: string;
  max_participants?: number;
  is_upcoming?: boolean;
  is_published?: boolean;
}

/**
 * Like d'activité
 */
export interface ActivityLike {
  id: number;
  activity: number;
  user: number;
  created_at: string;
}

/**
 * Inscription à une activité
 */
export interface ActivityRegistration {
  id: number;
  activity: number;
  user: number;
  nom_complet?: string;
  email?: string;
  telephone?: string;
  niveau_etude?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
  registered_at: string;
  confirmed_at?: string;
  cancellation_reason?: string;
}

/**
 * Proposition d'activité
 */
export interface ActivityProposal {
  id: number;
  title: string;
  description: string;
  category: ActivityCategory;
  proposed_date?: string;
  proposed_time?: string;
  location?: string;
  estimated_participants?: number;
  contact_email: string;
  additional_info?: string;
  image_url?: string;
  image_file?: string;
  image_file_url?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_comment?: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  created_by?: number;
  created_by_name?: string;
  proposal_type?: 'member' | 'guest';
}

/**
 * Données pour créer une proposition d'activité
 */
export interface ActivityProposalCreateData {
  title: string;
  description: string;
  category: ActivityCategory;
  proposed_date?: string;
  proposed_time?: string;
  location?: string;
  estimated_participants?: number;
  contact_email?: string;
  additional_info?: string;
  image_url?: string;
}

/**
 * Réponse paginée d'activités
 */
export interface ActivitiesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Activity[];
}