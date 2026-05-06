/**
 * Service de gestion des lauréats - Connexion au backend Django
 * ==============================================================
 */

import { apiGet, apiPatch, apiPost } from './api.config';

/**
 * Interface pour un lauréat dans la liste
 */
export interface LaureatListItem {
  id: number;
  nom: string;
  promotion: string;
  specialite: string;
  poste: string;
  entreprise: string;
  ville: string;
  pays: string;
  photo?: string;
}


/**
 * Réponse de l'API pour la liste des lauréats
 */
export interface LaureatsResponse {
  data: LaureatListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface LaureatStats {
  totalLaureats: number;
  totalEntreprises: number;
  totalPays: number;
  tauxEmploi: number;
}

/**
 * Filtres pour la recherche de lauréats
 */
export interface LaureatsFilters {
  search?: string;
  promotion?: string;
  specialite?: string;
  page?: number;
  limit?: number;
}

export interface LaureatJoinPayload {
  nom: string;
  promotion: string;
  specialite: string;
  poste: string;
  entreprise: string;
  ville: string;
  pays: string;
  contact: string;
}

export interface LaureatJoinResponse {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  submittedAt: string;
}

export interface LaureatJoinRequestItem {
  id: number;
  user_id?: number;
  user_email?: string;
  nom: string;
  promotion: string;
  specialite: string;
  poste: string;
  entreprise: string;
  ville: string;
  pays: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export interface LaureatJoinRequestsResponse {
  data: LaureatJoinRequestItem[];
  total: number;
}

/**
 * Service pour gérer les lauréats
 */
export class LaureatsService {
  
  /**
   * Récupère la liste des lauréats avec filtres
   * GET /api/laureats/
   */
  static async getLaureats(filters: LaureatsFilters = {}): Promise<LaureatsResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.promotion) params.append('promotion', filters.promotion);
    if (filters.specialite) params.append('specialite', filters.specialite);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/laureats/${queryString ? `?${queryString}` : ''}`;
    
    // L'endpoint est public (AllowAny), pas d'auth requise
    return apiGet<LaureatsResponse>(endpoint, false);
  }

  /**
   * Récupère un lauréat par son ID (profil détaillé)
   * GET /api/laureats/{userId}/profile/
   */
  static async getLaureatById(userId: number): Promise<LaureatListItem | null> {
    try {
      const response = await apiGet<LaureatListItem>(`/laureats/${userId}/`, false);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération du lauréat ${userId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les promotions disponibles pour les filtres
   */
  static async getPromotions(): Promise<string[]> {
    const response = await apiGet<{ data: string[] }>('/laureats/promotions/', false);
    return response.data || [];
  }

  /**
   * Récupère les spécialités pour les filtres
   */
  static async getSpecialites(): Promise<string[]> {
    try {
      const response = await apiGet<{ data: string[] }>('/laureats/specialites/', false);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités:', error);
      return [];
    }
  }

  static async getStats(): Promise<LaureatStats> {
    return apiGet<LaureatStats>('/laureats/stats/', false);
  }

  static async rejoindreAnnuaire(payload: LaureatJoinPayload): Promise<LaureatJoinResponse> {
    return apiPost<LaureatJoinResponse>('/laureats/rejoindre/', payload, true);
  }

  static async getJoinRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<LaureatJoinRequestsResponse> {
    const query = status ? `?status=${status}` : '';
    return apiGet<LaureatJoinRequestsResponse>(`/laureats/rejoindre/requests/${query}`, true);
  }

  static async updateJoinRequestStatus(
    requestId: number,
    status: 'approved' | 'rejected'
  ): Promise<{ message: string; data: LaureatJoinRequestItem }> {
    return apiPatch<{ message: string; data: LaureatJoinRequestItem }>(
      `/laureats/rejoindre/requests/${requestId}/`,
      { status },
      true
    );
  }
}

export default LaureatsService;
