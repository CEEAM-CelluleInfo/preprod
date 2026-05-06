/**
 * Service des activités - Connexion au backend Django
 * ====================================================
 */

import {
  Activity,
  ActivityCategoriesResponse,
  ActivitiesApiResponse,
  ActivityLikeStatus,
  ActivityStarResponse,
  RegistrationPayload,
  RegistrationSuccessResponse,
  UpcomingEvent,
  UpcomingEventsApiResponse,
} from '@/types/activity';
import { apiDelete, apiGet, apiPost } from './api.config';

/**
 * Service pour gérer les activités
 */
export class ActivityService {
  private static buildQuery(params: Record<string, string | number | undefined>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        query.set(key, String(value));
      }
    });
    const result = query.toString();
    return result ? `?${result}` : '';
  }

  private static extractActivities(payload: any): Activity[] {
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    if (Array.isArray(payload?.results)) {
      return payload.results;
    }
    if (Array.isArray(payload)) {
      return payload;
    }
    return [];
  }

  static async getActivities(params: {
    category?: string;
    urgency?: 'urgent' | 'normal';
    month?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ActivitiesApiResponse> {
    try {
      const query = this.buildQuery({
        category: params.category,
        urgency: params.urgency,
        month: params.month,
        page: params.page,
        limit: params.limit,
      });

      const response = await apiGet<any>(`/activities/${query}`);
      const raw = this.extractActivities(response);
      const data = raw.map(this.normalizeActivity);

      if (Array.isArray(response?.data)) {
        return {
          ...response,
          data,
        } as ActivitiesApiResponse;
      }

      // Compatibilité avec les anciennes réponses DRF paginées
      if (Array.isArray(response?.results)) {
        const page = Number(params.page || 1);
        const limit = Number(params.limit || response.results.length || 20);
        return {
          data,
          total: Number(response.count || data.length),
          page,
          limit,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: Number(response.count || data.length),
          },
          daysWithActivities: [],
        };
      }

      return {
        data,
        total: data.length,
        page: Number(params.page || 1),
        limit: Number(params.limit || data.length || 20),
        pagination: {
          currentPage: Number(params.page || 1),
          itemsPerPage: Number(params.limit || data.length || 20),
          totalItems: data.length,
        },
        daysWithActivities: [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      return {
        data: [],
        total: 0,
        page: Number(params.page || 1),
        limit: Number(params.limit || 20),
        pagination: {
          currentPage: Number(params.page || 1),
          itemsPerPage: Number(params.limit || 20),
          totalItems: 0,
        },
        daysWithActivities: [],
      };
    }
  }

  /**
   * Récupère toutes les activités publiées
   */
  static async getAllActivities(): Promise<Activity[]> {
    const response = await this.getActivities();
    return response.data;
  }

  /**
   * Récupère une activité par son ID
   */
  static async getActivityById(id: number): Promise<Activity | null> {
    try {
      const activity = await apiGet<Activity>(`/activities/${id}/`);
      return this.normalizeActivity(activity);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'activité ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupère les activités par catégorie
   */
  static async getActivitiesByCategory(category: string): Promise<Activity[]> {
    const response = await this.getActivities({ category });
    return response.data;
  }

  /**
   * Récupère les activités à venir
   */
  static async getUpcomingActivities(): Promise<Activity[]> {
    try {
      const response = await apiGet<UpcomingEventsApiResponse>('/activities/events/upcoming/');
      return response.data.map((event) =>
        this.normalizeActivity({
          id: event.id,
          title: event.title,
          description: '',
          long_description: '',
          category: 'event',
          location: event.location,
          date: event.date,
          time: event.time,
          event_time: event.time,
          isUpcoming: true,
          is_upcoming: true,
          likes_count: 0,
        } as Activity)
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des activités à venir:', error);
      return [];
    }
  }

  static async getUpcomingEvents(limit: number = 8): Promise<UpcomingEvent[]> {
    try {
      const query = this.buildQuery({ limit });
      const response = await apiGet<UpcomingEventsApiResponse>(`/activities/events/upcoming/${query}`);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements à venir:', error);
      return [];
    }
  }

  static async getActivityCategories(): Promise<string[]> {
    try {
      const response = await apiGet<ActivityCategoriesResponse>('/activities/categories/');
      return response.categories || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return [];
    }
  }

  /**
   * Récupère les activités passées
   */
  static async getPastActivities(): Promise<Activity[]> {
    try {
      const response = await this.getActivities();
      return response.data.filter((item) => !item.is_upcoming && !item.upcoming && !item.isUpcoming);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités passées:', error);
      return [];
    }
  }

  /**
   * Récupère l'état du like pour l'utilisateur connecté
   */
  static async getLikeStatus(activityId: number): Promise<ActivityLikeStatus | null> {
    try {
      const response = await apiGet<ActivityLikeStatus>(`/activities/${activityId}/like/`, true);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération du like de l'activité ${activityId}:`, error);
      return null;
    }
  }

  /**
   * Like une activité (nécessite authentification via cookies)
   */
  static async likeActivity(activityId: number): Promise<ActivityLikeStatus | null> {
    try {
      const response = await apiPost<ActivityLikeStatus>(`/activities/${activityId}/like/`, {}, true);
      return response;
    } catch (error) {
      console.error(`Erreur lors du like de l'activité ${activityId}:`, error);
      return null;
    }
  }

  /**
   * Unlike une activité (nécessite authentification via cookies)
   */
  static async unlikeActivity(activityId: number): Promise<ActivityLikeStatus | null> {
    try {
      await apiDelete(`/activities/${activityId}/like/`, true);
      return this.getLikeStatus(activityId);
    } catch (error) {
      console.error(`Erreur lors du unlike de l'activité ${activityId}:`, error);
      return null;
    }
  }

  /**
   * Toggle star/favori d'une activité
   */
  static async toggleStar(activityId: number): Promise<ActivityStarResponse | null> {
    try {
      return await apiPost<ActivityStarResponse>(`/activities/${activityId}/star/`, {}, true);
    } catch (error) {
      console.error(`Erreur lors du toggle star de l'activité ${activityId}:`, error);
      return null;
    }
  }

  /**
   * S'inscrire à une activité (nécessite authentification via cookies)
   */
  static async registerToActivity(
    activityId: number,
    payload?: Partial<RegistrationPayload>
  ): Promise<RegistrationSuccessResponse> {
    return apiPost<RegistrationSuccessResponse>(`/activities/${activityId}/register/`, payload || {}, false);
  }

  /**
   * Normalise une activité pour compatibilité avec l'ancien code frontend
   */
  private static normalizeActivity(activity: Activity): Activity {
    const numericId = Number(activity.id);
    const likesCount = activity.likes_count || activity.likesCount || activity.likes || activity.stars || 0;
    const image = activity.image_url || activity.imageUrl || activity.image || '';

    return {
      ...activity,
      id: Number.isNaN(numericId) ? 0 : numericId,
      longDescription: activity.long_description || activity.longDescription,
      imageUrl: image,
      image: image,
      date: activity.event_date ? new Date(activity.event_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : activity.date || 'Date à définir',
      time: activity.event_time || activity.time,
      participants: activity.registrations_count || activity.participants || activity.currentParticipants || 0,
      upcoming: activity.is_upcoming ?? activity.upcoming ?? activity.isUpcoming,
      isUpcoming: activity.isUpcoming ?? activity.is_upcoming ?? activity.upcoming,
      likes_count: likesCount,
      likesCount,
      likes: likesCount,
      stars: activity.stars || likesCount,
      userLiked: activity.user_liked || activity.userLiked || false,
      user_liked: activity.user_liked || false,
      user_registered: activity.user_registered || false,
      currentParticipants: activity.currentParticipants || activity.registrations_count || activity.participants || 0,
      maxParticipants: activity.maxParticipants || activity.max_participants,
      registrationDeadline: activity.registrationDeadline || activity.registration_deadline,
      categoryTab: activity.categoryTab,
      categoryLabel: activity.categoryLabel,
    };
  }
}