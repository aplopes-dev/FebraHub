import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({
  value,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const { t } = useTranslation('common');
  const rounded = Math.round(value);

  return (
    <div
      className={cn('flex gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={t('a11y.rating', { value, max })}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < rounded;
        const icon = (
          <Star
            style={{ width: size, height: size }}
            className={filled ? 'fill-amber-500 text-amber-500' : 'fill-black/10 text-black/10'}
          />
        );

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              className="cursor-pointer"
              aria-label={t('a11y.starCount', { count: i + 1 })}
              aria-pressed={i < rounded}
              onClick={() => onChange?.(i + 1)}
            >
              {icon}
            </button>
          );
        }

        return <span key={i}>{icon}</span>;
      })}
    </div>
  );
}
