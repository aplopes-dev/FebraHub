import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { screenLabel } from '@/i18n';
import { useCatalog } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { HeroBanner, ProductSection, CategoryShowcase } from '@/components/home/home-sections';
import { ProductGrid } from '@/components/product/product-card';
import { routes } from '@/lib/routes';

export function HomePage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();
  const { offerProducts, bestSellerProducts, apiReady, apiError, openProduct } = useCatalog();
  const { cardMin } = useLayout();

  if (!apiReady) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground" data-screen-label={screenLabel('home')}>
        {t('common:loadingCatalog')}
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('home')}>
      {apiError && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">{apiError}</p>
      )}
      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2">
        <HeroBanner />
      </div>
      <CategoryShowcase
        onSelect={(categoryId) => {
          if (categoryId === 'cupons') navigate(routes.coupons);
          else if (categoryId) navigate(routes.category(categoryId));
          else navigate(routes.search);
        }}
      />
      <ProductSection title={t('sections.dailyDeals')} onViewAll={() => navigate(routes.search)}>
        <ProductGrid
          products={offerProducts}
          cardMin={cardMin}
          onOpen={openProduct}
        />
      </ProductSection>
      <ProductSection title={t('sections.bestSellers')} onViewAll={() => navigate(routes.search)}>
        <ProductGrid
          products={bestSellerProducts}
          cardMin={cardMin}
          onOpen={openProduct}
        />
      </ProductSection>
    </div>
  );
}
