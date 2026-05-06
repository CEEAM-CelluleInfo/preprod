import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useActivityLikes } from '@/hooks/useActivityLikes';

interface LikeButtonProps {
  activityId: number;
  initialLikes?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LikeButton: React.FC<LikeButtonProps> = ({
  activityId,
  initialLikes = 0,
  showCount = true,
  size = 'md',
}) => {
  const { likes, userLiked, loading, toggleLike } = useActivityLikes(activityId);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = () => {
    if (loading) return;
    
    setIsAnimating(true);
    toggleLike();
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`${sizeClasses[size]} rounded-full transition-all duration-300 ${
          userLiked 
            ? 'bg-red-50 hover:bg-red-100' 
            : 'bg-gray-50 hover:bg-gray-100'
        } ${isAnimating ? 'scale-125' : ''}`}
        aria-label={userLiked ? "Retirer le like" : "Ajouter un like"}
      >
        <Heart
          size={iconSize[size]}
          className={`transition-colors duration-300 ${
            userLiked 
              ? 'text-red-500 fill-red-500' 
              : 'text-gray-400 hover:text-red-400'
          } ${isAnimating ? 'animate-pulse' : ''}`}
        />
      </button>
      
      {showCount && (
        <span className={`font-semibold ${
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        } ${userLiked ? 'text-red-600' : 'text-gray-600'}`}>
          {likes}
        </span>
      )}
    </div>
  );
};

export default LikeButton;