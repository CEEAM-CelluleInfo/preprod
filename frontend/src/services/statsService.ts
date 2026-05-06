/**
 * Service des statistiques - Connexion au backend Django
 * ======================================================
 */

import { apiGet } from './api.config';
import { Leader } from '@/types/leader';

/**
 * Interface des statistiques globales
 */
export interface Stats {
  laureats: string;
  events: string;
  pays: string;
  satisfaction: string;
}

/**
 * Interface de la réponse API des statistiques
 */
interface StatsApiResponse {
  total_laureats: number;
  total_activities: number;
  total_countries: number;
  total_members: number;
  upcoming_activities: number;
}

export class StatsService {
  /**
   * Récupère les statistiques depuis l'API
   */
  static async getStats(): Promise<Stats> {
    try {
      // Essayer de récupérer les vraies statistiques depuis l'API
      const response = await apiGet<StatsApiResponse>('/stats/');
      
      return {
        laureats: `${response.total_laureats}+`,
        events: `${response.total_activities}+`,
        pays: `${response.total_countries}+`,
        satisfaction: `95%` // À connecter à un système de feedback
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      // Fallback sur des valeurs par défaut
      return this.getDefaultStats();
    }
  }

  /**
   * Calcule les statistiques à partir des données disponibles
   */
  static calculateStats(leaders: Leader[], allLeaders?: Leader[]): Stats {
    // Compter les pays uniques
    const uniqueCountries = new Set(
      (allLeaders || leaders)
        .map(l => l.nationalite)
        .filter(Boolean)
    ).size;
    
    return {
      laureats: `500+`, // À ajuster avec données réelles
      events: `15+`, // À connecter aux activités
      pays: `${Math.max(20, uniqueCountries)}+`,
      satisfaction: `95%`
    };
  }

  /**
   * Valeurs par défaut si l'API échoue
   */
  private static getDefaultStats(): Stats {
    return {
      laureats: '500+',
      events: '15+',
      pays: '20+',
      satisfaction: '95%'
    };
  }
}