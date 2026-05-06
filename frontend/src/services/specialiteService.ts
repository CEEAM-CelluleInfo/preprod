/**
 * Service des spécialités - Connexion au backend Django
 * ======================================================
 */

import { Specialite } from '@/types/leader';
import { apiGet, PaginatedResponse } from './api.config';

export class SpecialiteService {
  /**
   * Récupère toutes les spécialités actives
   */
  static async getAllSpecialites(): Promise<Specialite[]> {
    try {
      const response = await apiGet<PaginatedResponse<Specialite>>('/specialites/');
      return response.results;
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités:', error);
      return [];
    }
  }

  /**
   * Récupère une spécialité par son ID
   */
  static async getSpecialiteById(id: number): Promise<Specialite | null> {
    try {
      const specialite = await apiGet<Specialite>(`/specialites/${id}/`);
      return specialite;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la spécialité ${id}:`, error);
      return null;
    }
  }

  /**
   * Recherche des spécialités par code ou intitulé
   */
  static async searchSpecialites(query: string): Promise<Specialite[]> {
    try {
      const response = await apiGet<PaginatedResponse<Specialite>>(`/specialites/?search=${encodeURIComponent(query)}`);
      return response.results;
    } catch (error) {
      console.error(`Erreur lors de la recherche de spécialités:`, error);
      return [];
    }
  }

  /**
   * Récupère une spécialité par son code
   */
  static async getSpecialiteByCode(code: string): Promise<Specialite | null> {
    try {
      const response = await apiGet<PaginatedResponse<Specialite>>(`/specialites/?search=${encodeURIComponent(code)}`);
      const found = response.results.find(s => s.code === code);
      return found || null;
    } catch (error) {
      console.error(`Erreur lors de la recherche de la spécialité ${code}:`, error);
      return null;
    }
  }
}
