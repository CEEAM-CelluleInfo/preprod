import { useState, useEffect } from 'react';
import { LikeService } from '@/services/likeService';
import { ActivityService } from '@/services/activityService';

export const useActivityLikes = (activityId: number) => {
  const [likes, setLikes] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const bootstrap = async () => {
      const apiState = await ActivityService.getLikeStatus(activityId);
      if (apiState) {
        setLikes(apiState.likesCount);
        setUserLiked(apiState.userLiked);
        return;
      }

      // Fallback local si l'utilisateur n'est pas connecté
      const savedLikes = LikeService.getLikesLocal(activityId);
      setLikes(savedLikes);
      const localLiked = localStorage.getItem(`user_liked_${activityId}`);
      setUserLiked(localLiked === 'true');
    };

    bootstrap();
  }, [activityId]);

  const toggleLike = async () => {
    setLoading(true);

    try {
      if (userLiked) {
        const apiResponse = await ActivityService.unlikeActivity(activityId);
        if (apiResponse) {
          setLikes(apiResponse.likesCount);
          setUserLiked(apiResponse.userLiked);
          localStorage.removeItem(`user_liked_${activityId}`);
          return;
        }

        // Fallback local
        const localCount = await LikeService.unlikeActivity(activityId);
        if (localCount) {
          setLikes((prev) => Math.max(0, prev - 1));
        }
        setUserLiked(false);
        localStorage.removeItem(`user_liked_${activityId}`);
      } else {
        const apiResponse = await ActivityService.likeActivity(activityId);
        if (apiResponse) {
          setLikes(apiResponse.likesCount);
          setUserLiked(apiResponse.userLiked);
          localStorage.setItem(`user_liked_${activityId}`, 'true');
          return;
        }

        // Fallback local
        await LikeService.likeActivity(activityId);
        setLikes((prev) => prev + 1);
        setUserLiked(true);
        localStorage.setItem(`user_liked_${activityId}`, 'true');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    likes,
    userLiked,
    loading,
    toggleLike,
  };
};