/**
 * Service des leaders/bureau - Connexion au backend Django
 * =========================================================
 */

import { Leader, LeadersResponse } from '@/types/leader';
import { apiGet, apiPost, apiPut, PaginatedResponse } from './api.config';

// Labels des positions pour affichage
const positionLabels: Record<string, string> = {
  'SG': 'Secrétaire Général',
  'SGA': 'Secrétaire Général Adjoint',
  'tresorier': 'Trésorier',
  'com': 'Chargé de Communication',
  'event': 'Chargé des Événements',
  'sport': 'Chargé des Sports',
  'culture': 'Chargé de la Culture',
  'integration': "Chargé de l'Intégration",
};

export class LeadersService {
  /**
   * Récupère les leaders avec pagination
   */
  static async getLeaders(page: number = 0, limit: number = 3): Promise<LeadersResponse> {
    try {
      // DRF utilise page 1-indexed, frontend utilise 0-indexed
      const apiPage = page + 1;
      const response = await apiGet<PaginatedResponse<Leader>>(`/leaders/?page=${apiPage}&page_size=${limit}`);
      
      // Normaliser les leaders pour compatibilité
      const normalizedLeaders = response.results.map(this.normalizeLeader);
      
      return {
        count: response.count,
        next: response.next,
        previous: response.previous,
        results: normalizedLeaders,
        // Compatibilité avec l'ancien code
        leaders: normalizedLeaders,
        total: response.count,
        page: page,
        totalPages: Math.ceil(response.count / limit)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des leaders:', error);
      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
        leaders: [],
        total: 0,
        page: 0,
        totalPages: 0
      };
    }
  }

  /**
   * Récupère un leader par ID
   */
  static async getLeaderById(id: number | string): Promise<Leader | null> {
    try {
      const leader = await apiGet<Leader>(`/leaders/${id}/`);
      return this.normalizeLeader(leader);
    } catch (error) {
      console.error(`Erreur lors de la récupération du leader ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupère tous les leaders (sans pagination)
   */
  static async getAllLeaders(): Promise<Leader[]> {
    try {
      const response = await apiGet<PaginatedResponse<Leader>>('/leaders/?page_size=100');
      return response.results.map(this.normalizeLeader);
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les leaders:', error);
      return [];
    }
  }

  /**
   * Récupère uniquement les Secrétaires Généraux
   */
  static async getSGsOnly(): Promise<Leader[]> {
    try {
      const response = await apiGet<PaginatedResponse<Leader>>('/leaders/?position=SG');
      return response.results.map(this.normalizeLeader);
    } catch (error) {
      console.error('Erreur lors de la récupération des SG:', error);
      return [];
    }
  }

  /**
   * Récupère les leaders du mandat actuel
   */
  static async getCurrentBureau(): Promise<Leader[]> {
    try {
      const response = await apiGet<PaginatedResponse<Leader>>('/leaders/?is_current=true');
      return response.results.map(this.normalizeLeader);
    } catch (error) {
      console.error('Erreur lors de la récupération du bureau actuel:', error);
      return [];
    }
  }

  /**
   * Ajouter un nouveau leader (admin seulement)
   */
  static async addLeader(leader: Omit<Leader, 'id'>): Promise<Leader | null> {
    try {
      const newLeader = await apiPost<Leader>('/leaders/', leader, true);
      return this.normalizeLeader(newLeader);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du leader:', error);
      return null;
    }
  }

  /**
   * Mettre à jour un leader (admin seulement)
   */
  static async updateLeader(id: number | string, updates: Partial<Leader>): Promise<Leader | null> {
    try {
      const updatedLeader = await apiPut<Leader>(`/leaders/${id}/`, updates, true);
      return this.normalizeLeader(updatedLeader);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du leader ${id}:`, error);
      return null;
    }
  }

  /**
   * Normalise un leader pour compatibilité avec l'ancien code frontend
   */
  private static normalizeLeader(leader: Leader): Leader {
    return {
      ...leader,
      // Alias pour compatibilité
      bureau: positionLabels[leader.position] || leader.position || leader.bureau,
      annee: leader.mandate_year || leader.annee,
      imageUrl: leader.image_url || leader.imageUrl,
    };
  }
}