/**
 * Types pour les membres du bureau - Compatible Django API
 */

/**
 * Types de postes du bureau (match Django POSITION_CHOICES)
 */
export type BureauPosition = 'SG' | 'SGA' | 'tresorier' | 'com' | 'event' | 'sport' | 'culture' | 'integration';

/**
 * Membre du bureau (modèle Django BureauMember)
 */
export interface Leader {
  id: number;
  user: number;
  position: BureauPosition;
  mandate_year: string;
  image_url?: string;
  display_order: number;
  is_current: boolean;
  
  // Données de l'utilisateur associé (incluses par le serializer)
  nom?: string; // user.last_name
  prenom?: string; // user.first_name
  email?: string; // user.email
  nationalite?: string; // user.country.name
  paysCode?: string; // user.country.flag_emoji
  linkedin?: string; // user.laureat_profile.linkedin_url
  filiere?: string; // user.specialite
  campus?: string;
  
  // Alias pour compatibilité
  bureau?: string; // Alias pour position (display)
  annee?: string; // Alias pour mandate_year
  imageUrl?: string; // Alias pour image_url
}

/**
 * Spécialité (modèle Django Specialite)
 */
export interface Specialite {
  id: number;
  code: string;
  intitule: string;
  is_active: boolean;
}

/**
 * Utilisateur (modèle Django User)
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  whatsapp?: string;
  country?: number;
  country_name?: string;
  promotion?: string;
  specialite?: number;
  specialite_code?: string;
  specialite_intitule?: string;
  role: 'student' | 'bureau' | 'admin' | 'laureat';
  avatar_url?: string;
  biographie?: string;
  preferred_language: 'fr' | 'en';
  is_active: boolean;
  date_joined: string;
  
  // Propriété calculée
  full_name?: string;
}

/**
 * Pays (modèle Django Country)
 */
export interface Country {
  id: number;
  name: string;
  code_iso: string;
  flag_emoji: string;
  continent?: string;
  is_active: boolean;
}

/**
 * Réponse paginée des leaders
 */
export interface LeadersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Leader[];
  
  // Pour compatibilité avec l'ancien code
  leaders?: Leader[];
  total?: number;
  page?: number;
  totalPages?: number;
}

/**
 * Données pour créer/modifier un membre du bureau
 */
export interface LeaderCreateData {
  user: number;
  position: BureauPosition;
  mandate_year: string;
  image_url?: string;
  display_order?: number;
  is_current?: boolean;
}