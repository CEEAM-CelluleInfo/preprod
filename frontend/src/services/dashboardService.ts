/**
 * Service du Dashboard - Connexion au backend Django
 * ===================================================
 */

import { apiGet } from './api.config';

/**
 * Interface des stats dashboard
 */
export interface DashboardStats {
  guides_consultes: number;
  guides_change: string;
  activites_participees: number;
  activites_change: string;
  contacts_laureats: number;
  contacts_change: string;
  evenements_ce_mois: number;
  evenements_change: string;
}

/**
 * Interface d'une activité à venir pour le dashboard
 */
export interface DashboardActivity {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  registered: number;
  month: string;
  day: number;
  imageUrl?: string | null;
}

/**
 * Interface d'un guide
 */
export interface Guide {
  id: number;
  titre: string;
  url_pdf?: string;
}

/**
 * Interface d'une annonce
 */
export interface Annonce {
  id: number;
  titre: string;
  temps_relatif: string;
  date?: string;
}

/**
 * Service pour le dashboard
 */
export class DashboardService {
  /**
   * Récupère les statistiques utilisateur pour le dashboard
   */
  static async getUserStats(): Promise<DashboardStats> {
    try {
      return await apiGet<DashboardStats>('/users/me/stats/', true);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des stats:', error);
      // Retourner des valeurs par défaut
      return {
        guides_consultes: 0,
        guides_change: '+0%',
        activites_participees: 0,
        activites_change: '+0%',
        contacts_laureats: 0,
        contacts_change: '+0',
        evenements_ce_mois: 0,
        evenements_change: '+0'
      };
    }
  }

  /**
   * Récupère les activités à venir
   */
  static async getUpcomingActivities(): Promise<DashboardActivity[]> {
    try {
      const response = await apiGet<{ data?: any[]; results?: any[] } | any[]>('/activities/events/upcoming/');
      const activities = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.results)
            ? response.results
            : [];

      return activities.map(activity => {
        // Utiliser event_date du backend Django (format ISO datetime)
        const dateStr = activity.event_date || activity.date_activity || activity.date;
        const activityDate = dateStr ? new Date(dateStr) : new Date();
        const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
        
        return {
          id: activity.id,
          title: activity.title || activity.titre,
          // Garder la date ISO pour le calendrier
          date: dateStr || new Date().toISOString(),
          // Utiliser event_time du backend Django
          time: activity.event_time || activity.time_activity || activity.heure || '14h00',
          location: activity.location || activity.lieu || 'À définir',
          duration: activity.duration || '1h00',
          // Utiliser registrations_count du backend Django
          registered: activity.registrations_count || activity.participants_count || activity.inscrits || 0,
          month: months[activityDate.getMonth()],
          day: activityDate.getDate(),
          // Ajouter l'image si disponible
          imageUrl: activity.image_url || activity.imageUrl || null
        };
      }).slice(0, 5); // Limiter à 5 activités
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      return [];
    }
  }

  /**
   * Récupère les guides d'intégration
   */
  static async getGuides(): Promise<Guide[]> {
    try {
      const response = await apiGet<Guide[]>('/guides/');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des guides:', error);
      // Retourner des données par défaut
      return [
        { id: 1, titre: 'Guide Logement' },
        { id: 2, titre: 'Transport & Mobilité' },
        { id: 3, titre: 'Restauration' },
        { id: 4, titre: 'Bibliothèque & Ressources' }
      ];
    }
  }

  /**
   * Récupère les annonces récentes
   */
  static async getAnnonces(): Promise<Annonce[]> {
    try {
      const response = await apiGet<Annonce[]>('/annonces/');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces:', error);
      // Retourner des données par défaut
      return [
        { id: 1, titre: 'Ouverture inscriptions pédagogiques', temps_relatif: 'Il y a 2h' },
        { id: 2, titre: 'Nouveau guide logement disponible', temps_relatif: 'Il y a 1h' },
        { id: 3, titre: 'Réunion bureau CEEAM', temps_relatif: 'Il y a 30min' }
      ];
    }
  }

  /**
   * Récupère toutes les données du dashboard en une seule requête
   */
  static async getDashboardData(): Promise<{
    stats: DashboardStats;
    activities: DashboardActivity[];
    guides: Guide[];
    annonces: Annonce[];
  }> {
    const [stats, activities, guides, annonces] = await Promise.all([
      this.getUserStats(),
      this.getUpcomingActivities(),
      this.getGuides(),
      this.getAnnonces()
    ]);

    return { stats, activities, guides, annonces };
  }
}
