import { useState, useEffect, useCallback } from 'react';
import { Activity } from '@/types/activity';
import { ActivityService } from '@/services/activityService';
import { LikeService } from '@/services/likeService';

export const useActivities = (category?: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      let data: Activity[];
      
      if (category && category !== 'tous') {
        data = await ActivityService.getActivitiesByCategory(category);
      } else {
        data = await ActivityService.getAllActivities();
      }
      
      const upcoming = await ActivityService.getUpcomingActivities();
      
      // Fusionner avec les likes du localStorage
      const enhancedData = data.map(activity => ({
        ...activity,
        likes: activity.likes || 0,
        userLiked: activity.userLiked || false
      }));
      
      const enhancedUpcoming = upcoming.map(activity => ({
        ...activity,
        likes: activity.likes || 0,
        userLiked: activity.userLiked || false
      }));
      
      setActivities(enhancedData);
      setUpcomingActivities(enhancedUpcoming);
    } catch (err) {
      setError('Erreur lors du chargement des activités');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  // Fonction pour liker une activité
  const likeActivity = useCallback(async (activityId: number) => {
    try {
      // Mise à jour optimiste immédiate
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: (activity.likes || 0) + 1,
              userLiked: true 
            }
          : activity
      ));

      // Mettre à jour aussi upcomingActivities si nécessaire
      setUpcomingActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: (activity.likes || 0) + 1,
              userLiked: true 
            }
          : activity
      ));

      // Enregistrer dans localStorage
      LikeService.likeActivity(activityId);
      
      // Si vous avez un backend, décommentez cette ligne :
      // await ActivityService.likeActivity(activityId);

      return true;
    } catch (err) {
      // Rollback en cas d'erreur
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: Math.max(0, (activity.likes || 0) - 1),
              userLiked: false 
            }
          : activity
      ));
      
      setUpcomingActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: Math.max(0, (activity.likes || 0) - 1),
              userLiked: false 
            }
          : activity
      ));
      
      console.error('Erreur lors du like:', err);
      return false;
    }
  }, []);

  // Fonction pour retirer un like
  const unlikeActivity = useCallback(async (activityId: number) => {
    try {
      // Mise à jour optimiste immédiate
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: Math.max(0, (activity.likes || 0) - 1),
              userLiked: false 
            }
          : activity
      ));

      // Mettre à jour aussi upcomingActivities si nécessaire
      setUpcomingActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: Math.max(0, (activity.likes || 0) - 1),
              userLiked: false 
            }
          : activity
      ));

      // Enregistrer dans localStorage
      LikeService.unlikeActivity(activityId);
      
      // Si vous avez un backend, décommentez cette ligne :
      // await ActivityService.unlikeActivity(activityId);

      return true;
    } catch (err) {
      // Rollback en cas d'erreur
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: (activity.likes || 0) + 1,
              userLiked: true 
            }
          : activity
      ));
      
      setUpcomingActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              likes: (activity.likes || 0) + 1,
              userLiked: true 
            }
          : activity
      ));
      
      console.error('Erreur lors du unlike:', err);
      return false;
    }
  }, []);

  // Fonction pour basculer like/unlike
  const toggleLike = useCallback(async (activityId: number) => {
    const activity = activities.find(a => a.id === activityId);
    if (activity?.userLiked) {
      await unlikeActivity(activityId);
    } else {
      await likeActivity(activityId);
    }
  }, [activities, likeActivity, unlikeActivity]);

  // Fonction pour réinitialiser les likes (pour le développement)
  const resetLikes = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activity_likes');
      // Réinitialiser tous les userLiked
      const userLikedKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_liked_')
      );
      userLikedKeys.forEach(key => localStorage.removeItem(key));
      
      // Recharger les activités
      fetchActivities();
    }
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    upcomingActivities,
    loading,
    error,
    refetch: fetchActivities,
    toggleLike,
    likeActivity,
    unlikeActivity,
    resetLikes
  };
};