/**
 * Service des dates académiques - Connexion au backend Django
 * ===========================================================
 */

import { DateItem, DatesResponse, getDefaultDates } from '@/types/dates';
import { apiGet, PaginatedResponse } from './api.config';

export class DatesService {
  /**
   * Récupère toutes les dates académiques
   */
  static async getAllDates(): Promise<DateItem[]> {
    try {
      const response = await apiGet<PaginatedResponse<DateItem>>('/dates/');
      return response.results.map(this.normalizeDateItem);
    } catch (error) {
      console.error('Erreur lors de la récupération des dates:', error);
      // Fallback sur les dates par défaut
      return getDefaultDates();
    }
  }

  /**
   * Récupère les dates par année académique
   */
  static async getDatesByYear(academicYear: string): Promise<DateItem[]> {
    try {
      const response = await apiGet<PaginatedResponse<DateItem>>(`/dates/?academic_year=${academicYear}`);
      return response.results.map(this.normalizeDateItem);
    } catch (error) {
      console.error(`Erreur lors de la récupération des dates ${academicYear}:`, error);
      return getDefaultDates();
    }
  }

  /**
   * Récupère les dates par semestre
   */
  static async getDatesBySemester(semester: 'A' | 'B'): Promise<DateItem[]> {
    try {
      const response = await apiGet<PaginatedResponse<DateItem>>(`/dates/?semester=${semester}`);
      return response.results.map(this.normalizeDateItem);
    } catch (error) {
      console.error(`Erreur lors de la récupération des dates semestre ${semester}:`, error);
      return getDefaultDates().filter(d => d.semester === semester);
    }
  }

  /**
   * Récupère les dates de l'année courante
   */
  static async getCurrentYearDates(): Promise<DatesResponse> {
    try {
      const currentYear = new Date().getFullYear();
      const academicYear = new Date().getMonth() >= 8 
        ? `${currentYear}-${currentYear + 1}` 
        : `${currentYear - 1}-${currentYear}`;
      
      const response = await apiGet<PaginatedResponse<DateItem>>(`/dates/?academic_year=${academicYear}`);
      const dates = response.results.map(this.normalizeDateItem);
      
      return {
        count: response.count,
        next: response.next,
        previous: response.previous,
        results: dates,
        // Compatibilité avec l'ancien code
        dates: dates,
        academicYear: academicYear,
        lastUpdated: dates.length > 0 ? dates[0].updated_at : undefined,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des dates courantes:', error);
      const defaultDates = getDefaultDates();
      return {
        count: defaultDates.length,
        next: null,
        previous: null,
        results: defaultDates,
        dates: defaultDates,
        academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      };
    }
  }

  /**
   * Récupère une date spécifique par ID
   */
  static async getDateById(id: number): Promise<DateItem | null> {
    try {
      const date = await apiGet<DateItem>(`/dates/${id}/`);
      return this.normalizeDateItem(date);
    } catch (error) {
      console.error(`Erreur lors de la récupération de la date ${id}:`, error);
      return null;
    }
  }

  /**
   * Normalise une date pour compatibilité avec l'ancien code frontend
   */
  private static normalizeDateItem(date: DateItem): DateItem {
    return {
      ...date,
      // Alias pour compatibilité
      academicYear: date.academic_year || date.academicYear,
    };
  }
}
