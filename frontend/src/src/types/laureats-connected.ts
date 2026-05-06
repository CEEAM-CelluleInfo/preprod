/**
 * Types pour les lauréats et profils utilisateurs connectés
 */

// =====================================================
// TYPES D'HISTORIQUE ACADÉMIQUE ET PROFESSIONNEL
// =====================================================

// Types d'entrée d'historique
export type HistoriqueEntryType = 
  | 'academic'       // Formation académique
  | 'professional'   // Expérience professionnelle
  | 'certification'  // Certification / Diplôme
  | 'project'        // Projet personnel
  | 'volunteering'   // Bénévolat / Associatif
  | 'other';         // Autre

// Labels pour les types d'entrée
export const HISTORIQUE_TYPE_LABELS: Record<HistoriqueEntryType, string> = {
  academic: 'Formation académique',
  professional: 'Expérience professionnelle',
  certification: 'Certification / Diplôme',
  project: 'Projet personnel',
  volunteering: 'Bénévolat / Associatif',
  other: 'Autre',
};

// Entrée d'historique (nouveau format relationnel)
export interface HistoriqueEntry {
  id?: number;
  entryType: HistoriqueEntryType;
  typeDisplay?: string;
  title: string;
  organization: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null;  // YYYY-MM-DD ou null si en cours
  isCurrent: boolean;
  description: string;
}

// Ancien format (legacy) - gardé pour compatibilité
export interface HistoriqueItem {
  date: string;
  event: string;
  description?: string;
}


// =====================================================
// TYPES DE COMPÉTENCES
// =====================================================

// Niveaux de compétence
export type CompetenceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | '';

// Labels pour les niveaux
export const COMPETENCE_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

// Catégorie de compétences prédéfinie
export interface CompetenceCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  isPredefined: boolean;
  order: number;
}

// Compétence utilisateur (nouveau format relationnel)
export interface UserCompetence {
  id?: number;
  categoryId?: number;
  category?: number;
  categoryName?: string;
  name: string;
  level?: CompetenceLevel;
  levelDisplay?: string;
}

// Compétences groupées par catégorie (format API)
export interface CompetenceGroup {
  categoryId: number;
  categorie: string;
  icon?: string;
  competences: UserCompetence[];
}

// Ancien format (legacy) - gardé pour compatibilité
export interface CompetenceCategorie {
  categorie: string;
  competences: string[];
}


// =====================================================
// PROFIL UTILISATEUR
// =====================================================

// Profil utilisateur pour l'édition (lauréat) - SANS CAMPUS
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  nationality: string;
  biography: string;
  quote?: string;
  promotion: string;
  field: string;
  // campus: string;  // ← SUPPRIMÉ
  linkedin: string;
  interests: string[];
  searches: string[];
  // Infos professionnelles (emploi actuel)
  jobTitle?: string;
  jobCompany?: string;
  jobCity?: string;
  jobEmail?: string;
  jobDomain?: string;
}

// Profil lauréat complet pour l'affichage - SANS CAMPUS
export interface LaureatProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  preferredLanguage: string;
  biography: string;
  quote?: string;
  promotion: string;
  field: string;
  // campus: string;  // ← SUPPRIMÉ
  linkedin: string;
  profileImage?: string;
  interests: string[];
  searches: string[];
  
  // Options lauréat
  isMentorAvailable: boolean;
  isProfilePublic: boolean;
  mentorshipAreas: string[];
  
  // Infos professionnelles
  job?: {
    title: string;
    company: string;
    location: string;
    email: string;
    domain: string;
  };
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  
  // Historique et compétences (nouveau format relationnel)
  historique?: HistoriqueEntry[];
  competences?: CompetenceGroup[];
}

// Profil pour la vue (format d'affichage) - SANS CAMPUS
export interface LaureatViewProfile {
  id: number;
  name: string;
  initials: string;
  status: string;
  promotion: string;
  speciality: string;
  // campus: string;  // ← SUPPRIMÉ
  nationality: string;
  memberSince: string;
  bio: string;
  
  stats: {
    id: number;
    value: number;
    label: string;
  }[];
  
  job: {
    title: string;
    company: string;
    location: string;
    email: string;
    domain: string;
  };
  
  personalInfo: {
    email: string;
    phone: string;
    nationality: string;
    language: string;
  };
  quote?: string;
  
  academicInfo: {
    promotion: string;
    field: string;
    // campus: string;  // ← SUPPRIMÉ
    linkedin: string;
  };
  
  // Historique et compétences (nouveau format relationnel)
  historique?: HistoriqueEntry[];
  competences?: CompetenceGroup[];
}

// Stats utilisateur
export interface UserStats {
  activities: number;
  votes: number;
  connections: number;
  contributions: number;
}

// Réponse API pour le profil utilisateur - SANS CAMPUS
export interface ProfileApiResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: number;
  country_name: string;
  country_flag: string;
  nationality: string;
  promotion: string;
  quote?: string;
  specialite: number;
  specialite_intitule: string;
  field: string;
  avatar_url: string;
  photoUrl: string;
  biographie: string;
  biography: string;
  preferred_language: string;
  language: string;
  // campus: string;  // ← SUPPRIMÉ
  linkedin_url: string;
  linkedin: string;
  interests: string[];
  looking_for: string[];
  lookingFor: string[];
  date_joined: string;
}