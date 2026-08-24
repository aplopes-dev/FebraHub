import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { screenLabel } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import { useCatalog } from '@/context/AppContext';
import { useFavoriteIds } from '@/state/favorites-store';
import { useLayout } from '@/hooks/useLayout';
import { ProductGrid } from '@/components/product/product-card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageTitle } from '@/components/shared/layout-primitives';
import { routes } from '@/lib/routes';

export function FavoritesPage() {
  const { t } = useTranslation('engagement');
  const navigate = useNavigate();
  const { products, decorate, openProduct } = useCatalog();
  const { cardMin } = useLayout();
  const favoriteIds = useFavoriteIds();
  const favList = useMemo(
    () =>
      favoriteIds.flatMap((id) => {
        const p = products.find((x) => x.id === id);
        return p ? [decorate(p)] : [];
      }),
    [favoriteIds, products, decorate],
  );
  const favEmpty = favList.length === 0;

  return (
    <div data-screen-label={screenLabel('favorites')}>
      <PageTitle>{t('favorites.title')}</PageTitle>
      {favEmpty ? (
        <EmptyState
          icon={Heart}
          title={t('favorites.emptyTitle')}
          description={t('favorites.emptyDescription')}
          actionLabel={t('favorites.emptyAction')}
          onAction={() => navigate(routes.home)}
        />
      ) : (
        <ProductGrid
          products={favList}
          cardMin={cardMin}
          onOpen={openProduct}
        />
      )}
    </div>
  );
}
