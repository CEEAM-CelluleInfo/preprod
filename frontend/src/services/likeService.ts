/**
 * Service des likes - Connexion au backend Django
 * ===============================================
 */

import { ActivityLikeStatus } from '@/types/activity';
import { apiDelete, apiPost, STORAGE_KEYS } from './api.config';

// Pour compatibilité avec le stockage local (mode hors-ligne)
const LOCAL_STORAGE_KEY = STORAGE_KEYS.LIKED_ACTIVITIES;

export class LikeService {
  /**
   * Récupère le nombre de likes depuis le localStorage (mode hors-ligne)
   */
  static getLikesLocal(activityId: number): number {
    if (typeof window === 'undefined') return 0;
    
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const likes: Record<number, number> = stored ? JSON.parse(stored) : {};
    
    return likes[activityId] || 0;
  }

  /**
   * Like une activité via l'API (avec auth via cookies)
   */
  static async likeActivity(activityId: number): Promise<ActivityLikeStatus | null> {
    try {
      // Essayer l'API en premier (auth via cookies HttpOnly)
      const response = await apiPost<ActivityLikeStatus>(
        `/activities/${activityId}/like/`,
        {},
        true
      );
      return response;
    } catch (error) {
      console.error(`Erreur lors du like de l'activité ${activityId}:`, error);
      // Fallback sur le stockage local si l'API échoue
      return this.likeActivityLocal(activityId);
    }
  }

  /**
   * Unlike une activité via l'API (avec auth via cookies)
   */
  static async unlikeActivity(activityId: number): Promise<boolean> {
    try {
      // Essayer l'API en premier (auth via cookies HttpOnly)
      await apiDelete(`/activities/${activityId}/like/`, true);
      return true;
    } catch (error) {
      console.error(`Erreur lors du unlike de l'activité ${activityId}:`, error);
      // Fallback sur le stockage local si l'API échoue
      this.unlikeActivityLocal(activityId);
      return true;
    }
  }

  /**
   * Like local (mode hors-ligne)
   */
  private static likeActivityLocal(activityId: number): ActivityLikeStatus | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const likes: Record<number, number> = stored ? JSON.parse(stored) : {};
    
    likes[activityId] = (likes[activityId] || 0) + 1;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(likes));
    localStorage.setItem(`user_liked_${activityId}`, 'true');
    
    return {
      activityId: String(activityId),
      likesCount: likes[activityId] || 0,
      userLiked: true,
    };
  }

  /**
   * Unlike local (mode hors-ligne)
   */
  private static unlikeActivityLocal(activityId: number): number {
    if (typeof window === 'undefined') return 0;
    
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const likes: Record<number, number> = stored ? JSON.parse(stored) : {};
    
    if (likes[activityId] && likes[activityId] > 0) {
      likes[activityId] -= 1;
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(likes));
    localStorage.removeItem(`user_liked_${activityId}`);
    
    return likes[activityId] || 0;
  }

  /**
   * Vérifie si l'utilisateur a liké (mode hors-ligne)
   */
  static hasLikedLocal(activityId: number): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`user_liked_${activityId}`) === 'true';
  }
}