import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { favoritesStore, useIsFavorite } from '@/state/favorites-store';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  /** Produto que este botão representa — assina o status só deste id. */
  productId: string;
  label?: string;
  className?: string;
}

export function FavoriteButton({ productId, label, className }: FavoriteButtonProps) {
  const { t } = useTranslation('catalog');
  const isFav = useIsFavorite(productId);
  const ariaLabel = label ?? t('favorite.aria');

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      aria-pressed={isFav}
      className={cn(
        'absolute top-2 right-2 z-2 size-[34px] rounded-full bg-white/95 shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:bg-white',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        favoritesStore.toggle(productId);
      }}
    >
      <Heart
        className="size-[18px]"
        fill={isFav ? '#111111' : 'transparent'}
        stroke={isFav ? '#111111' : 'rgba(0,0,0,0.5)'}
      />
    </Button>
  );
}
