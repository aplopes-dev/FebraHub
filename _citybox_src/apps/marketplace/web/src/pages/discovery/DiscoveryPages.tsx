import { useEffect, useMemo, useState } from 'react';
import { screenLabel } from '@/i18n';
import { LayoutGrid } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/context/AppContext';
import { ProductGrid } from '@/components/product/product-card';
import { FilterSheet, SearchFilterSidebar } from '@/components/search/filter-panels';
import { SearchToolbar } from '@/components/search/search-toolbar';
import { EmptyState } from '@/components/shared/empty-state';
import { StarRating } from '@/components/shared/star-rating';
import { SubPageLayout } from '@/components/shared/sub-page-layout';
import { Button } from '@/components/ui/button';
import { PanelCard, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { useLayout } from '@/hooks/useLayout';
import type { Review } from '@/types';
import {
  brandsFromProducts,
  categoryById,
  DEFAULT_SEARCH_FILTERS,
  filterAndSortProducts,
  type SearchFilters,
} from '@/utils/search';
import { routes } from '@/lib/routes';

export function CategoryPage() {
  const { t } = useTranslation(['home', 'catalog', 'search']);
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId = '' } = useParams<{ categoryId: string }>();
  const { categories, products, decorate, openProduct, apiReady } = useCatalog();
  const { cardMin, listCols, showSearchSidebar, showFilterBtn } = useLayout();
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key, categoryId]);

  useEffect(() => {
    if (categoryId === 'cupons') {
      navigate(routes.coupons, { replace: true });
    }
  }, [categoryId, navigate]);

  useEffect(() => {
    setFilters(DEFAULT_SEARCH_FILTERS);
    setFiltersOpen(false);
  }, [categoryId]);

  const category = categoryById(categoryId, categories);
  const categoryName =
    category == null
      ? t('category.fallbackTitle')
      : category.name.includes('.')
        ? t(`categories.${category.id}`, { ns: 'catalog' })
        : category.name;

  const categoryProducts = useMemo(
    () => products.filter((p) => p.categoryId === categoryId),
    [products, categoryId],
  );

  const brands = useMemo(() => brandsFromProducts(categoryProducts), [categoryProducts]);

  const productList = useMemo(
    () => filterAndSortProducts(categoryProducts, '', filters).map(decorate),
    [categoryProducts, filters, decorate],
  );

  if (categoryId === 'cupons') {
    return null;
  }

  if (!apiReady) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground" data-screen-label={screenLabel('category')}>
        {t('category.loading')}
      </div>
    );
  }

  if (!category) {
    return (
      <div data-screen-label={screenLabel('category')}>
        <EmptyState
          icon={LayoutGrid}
          title={t('category.emptyTitle')}
          description={t('category.emptyDescription')}
          actionLabel={t('category.emptyAction')}
          onAction={() => navigate(routes.home)}
        />
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('category')}>
      <SearchToolbar
        resultCount={productList.length}
        subject={categoryName}
        showFilterBtn={showFilterBtn}
        onOpenFilters={() => setFiltersOpen(true)}
        sortBy={filters.sortBy}
      />
      {productList.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={
            categoryProducts.length > 0
              ? t('empty.title', { ns: 'search' })
              : t('category.emptyTitle')
          }
          description={
            categoryProducts.length > 0
              ? t('empty.description', { ns: 'search' })
              : t('category.emptyDescription')
          }
          actionLabel={
            categoryProducts.length > 0
              ? t('empty.action', { ns: 'search' })
              : t('category.emptyAction')
          }
          onAction={() =>
            categoryProducts.length > 0
              ? setFilters(DEFAULT_SEARCH_FILTERS)
              : navigate(routes.home)
          }
        />
      ) : (
        <TwoColumnLayout columns={listCols}>
          {showSearchSidebar && (
            <SearchFilterSidebar filters={filters} onApply={setFilters} brands={brands} />
          )}
          <ProductGrid
            products={productList}
            variant="search"
            cardMin={cardMin}
            className="min-w-0"
            onOpen={openProduct}
          />
        </TwoColumnLayout>
      )}
      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={setFilters}
        onReset={() => setFilters(DEFAULT_SEARCH_FILTERS)}
        brands={brands}
      />
    </div>
  );
}

function RatingDistribution({ reviews }: { reviews: Review[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = reviews.filter((r) => r.rating === stars).length;
        const fraction = reviews.length === 0 ? 0 : count / reviews.length;
        return (
          <div key={stars} className="flex items-center gap-2">
            <span className="w-7 text-xs text-muted-foreground">{stars}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${fraction * 100}%` }}
              />
            </div>
            <span className="w-5 text-right text-xs text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-sm font-bold text-white">
          {review.author.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{review.author}</div>
          <div className="text-xs text-muted-foreground">{review.date}</div>
        </div>
        <StarRating value={review.rating} size={12} />
      </div>
      <p className="text-sm leading-relaxed text-[rgba(0,0,0,0.85)]">{review.text}</p>
      {review.photoUrls && review.photoUrls.length > 0 && (
        <div className="flex gap-2">
          {review.photoUrls.map((url) => (
            <img key={url} src={url} alt="" className="size-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewsPage() {
  const { t } = useTranslation('orders');
  const navigate = useNavigate();
  const { id = 'p1' } = useParams<{ id: string }>();
  const { getProduct, reviews, averageRating } = useCatalog();
  const { isMobile } = useLayout();
  const product = getProduct(id);
  const productReviews = reviews[id] ?? [];
  const average =
    productReviews.length === 0 ? product.rating : averageRating(id);

  const summaryBlock = (
    <>
      <h2 className="text-base font-extrabold leading-snug">{product.title}</h2>

      <div className="flex items-center gap-3">
        <span className="text-4xl font-extrabold text-amber-500">{average.toFixed(1)}</span>
        <div>
          <StarRating value={average} size={16} />
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('reviews.count', { count: productReviews.length })}
          </p>
        </div>
      </div>

      <RatingDistribution reviews={productReviews} />
    </>
  );

  const reviewsBlock = (
    <>
      {productReviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('reviews.beFirst')}</p>
      ) : (
        productReviews.map((review) => (
          <div key={review.id}>
            <ReviewRow review={review} />
            <hr className="border-black/5" />
          </div>
        ))
      )}

      <Button
        className="h-12 w-full rounded-lg text-[15px] font-bold"
        onClick={() => navigate(routes.writeReview(id), { state: { returnTo: routes.productReviews(id) } })}
      >
        {t('reviews.write')}
      </Button>
    </>
  );

  return (
    <div data-screen-label={screenLabel('reviews')}>
      <SubPageLayout title={t('reviews.title')} backTo={routes.product(id)} width="wide">
        <PanelCard className="flex flex-col gap-4 p-5">
          {isMobile ? (
            <>
              {summaryBlock}
              <hr className="border-black/5" />
              {reviewsBlock}
            </>
          ) : (
            <TwoColumnLayout columns="minmax(0,280px) minmax(0,1fr)" className="items-start gap-8">
              <div className="flex flex-col gap-4">{summaryBlock}</div>
              <div className="flex min-w-0 flex-col gap-4">{reviewsBlock}</div>
            </TwoColumnLayout>
          )}
        </PanelCard>
      </SubPageLayout>
    </div>
  );
}
