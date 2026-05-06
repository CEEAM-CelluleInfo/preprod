import { Star, StarHalf } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showCount?: boolean;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  showCount = true,
  interactive = false,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (star: number) => {
    if (interactive && onRate) {
      onRate(star);
    }
  };

  const handleMouseEnter = (star: number) => {
    if (interactive) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          const filled = displayRating >= starValue;
          const halfFilled = displayRating >= starValue - 0.5 && displayRating < starValue;

          return (
            <button
              key={index}
              type="button"
              className={`p-0.5 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              disabled={!interactive}
            >
              {halfFilled ? (
                <StarHalf
                  size={size}
                  className="text-orange-500 fill-orange-500"
                />
              ) : (
                <Star
                  size={size}
                  className={`${filled ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`}
                />
              )}
            </button>
          );
        })}
      </div>
      {showCount && (
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

export default StarRating;