/**
 * Service du contenu - Connexion au backend Django
 * =================================================
 */

import { ContentSection } from '@/types/content';
import { apiGet, PaginatedResponse } from './api.config';

// Données par défaut (fallback si API échoue)
const defaultContent: Record<string, ContentSection> = {
  mission: {
    id: 'mission',
    title: 'Notre Mission',
    content: `La CEEAM a pour mission d'accompagner et de soutenir les étudiants étrangers tout au long de leur parcours à l'École Nationale Supérieure d'Arts et Métiers.`,
    language: 'fr'
  },
  vision: {
    id: 'vision',
    title: 'Notre Vision',
    content: `Notre vision est de devenir la référence incontournable pour tous les étudiants étrangers des Arts et Métiers.`,
    language: 'fr'
  },
  valeurs: {
    id: 'valeurs',
    title: 'Nos Valeurs',
    content: `Solidarité, Diversité, Excellence, Intégration, Innovation, Durabilité.`,
    language: 'fr'
  }
};

export class ContentService {
  /**
   * Récupère une section de contenu par son ID
   */
  static async getSection(sectionId: string): Promise<ContentSection> {
    try {
      const section = await apiGet<ContentSection>(`/content/${sectionId}/`);
      return section;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la section ${sectionId}:`, error);
      // Fallback sur les données par défaut
      if (defaultContent[sectionId]) {
        return defaultContent[sectionId];
      }
      throw new Error(`Section ${sectionId} non trouvée`);
    }
  }

  /**
   * Récupère toutes les sections de contenu
   */
  static async getAllSections(): Promise<Record<string, ContentSection>> {
    try {
      const response = await apiGet<PaginatedResponse<ContentSection>>('/content/');
      
      // Convertir le tableau en objet indexé par ID
      const sections: Record<string, ContentSection> = {};
      response.results.forEach(section => {
        sections[section.id] = section;
      });
      
      return sections;
    } catch (error) {
      console.error('Erreur lors de la récupération des sections:', error);
      // Fallback sur les données par défaut
      return defaultContent;
    }
  }

  /**
   * Récupère les sections par langue
   */
  static async getSectionsByLanguage(language: 'fr' | 'en'): Promise<ContentSection[]> {
    try {
      const response = await apiGet<PaginatedResponse<ContentSection>>(`/content/?language=${language}`);
      return response.results;
    } catch (error) {
      console.error(`Erreur lors de la récupération des sections ${language}:`, error);
      return Object.values(defaultContent);
    }
  }
}