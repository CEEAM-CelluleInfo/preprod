/**
 * Types pour le contenu - Compatible Django API
 */

/**
 * Section de contenu (modèle Django ContentSection)
 */
export interface ContentSection {
  id: string; // Identifiant primaire (ex: 'mission', 'vision', 'valeurs')
  title: string;
  content: string;
  language: 'fr' | 'en';
  last_updated?: string;
  updated_by?: number;
}

/**
 * Données pour créer/modifier une section de contenu
 */
export interface ContentSectionCreateData {
  id: string;
  title: string;
  content: string;
  language?: 'fr' | 'en';
}

/**
 * Réponse paginée du contenu
 */
export interface ContentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ContentSection[];
  
  // Pour compatibilité
  sections?: ContentSection[];
  total?: number;
}