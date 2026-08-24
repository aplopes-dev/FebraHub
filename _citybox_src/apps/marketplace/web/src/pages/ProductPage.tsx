import { useNavigate, useParams } from 'react-router-dom';
import { screenLabel } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useCart, useCatalog, useCheckout } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { PanelCard } from '@/components/shared/layout-primitives';
import { ProductPriceBlock, RatingDisplay } from '@/components/product/product-primitives';
import {
  MobileProductBar,
  ProductBuyPanel,
  ProductGallery,
} from '@/components/product/product-detail';
import { deliveryChipLabel } from '@/utils/product-pricing';
import { routes } from '@/lib/routes';

export function ProductPage() {
  const { t } = useTranslation('product');
  const { id = 'p1' } = useParams();
  const navigate = useNavigate();
  const { getProduct } = useCatalog();
  const { buyNow, addCurrentToCart } = useCart();
  const { selectedShipping } = useCheckout();
  const { pdpCols, isMobile } = useLayout();
  const product = getProduct(id);
  const deliveryLabel = deliveryChipLabel(selectedShipping, product.full);

  return (
    <>
      <div data-screen-label={screenLabel('product')} className={isMobile ? 'pb-20' : undefined}>
        <div className="mb-3 text-[13px] text-muted-foreground">
          <button type="button" className="cursor-pointer text-foreground" onClick={() => navigate(routes.search)}>
            {t('page.backToList')}
          </button>{' '}
          · {t('page.breadcrumb')}
        </div>
        <PanelCard
          className="grid items-start gap-7 p-[clamp(16px,3vw,28px)]"
          style={{ gridTemplateColumns: pdpCols }}
        >
          <ProductGallery image={product.img} />
          <div className="min-w-0">
            <div className="mb-1.5 text-xs text-muted-foreground">
              {t('page.condition', { count: product.reviews })}
            </div>
            <h1 className="mb-2.5 text-[clamp(19px,2.6vw,24px)] leading-snug font-semibold text-[rgba(0,0,0,0.9)]">
              {product.title}
            </h1>
            <RatingDisplay {...product} size="md" />
            <button
              type="button"
              className="mt-1 cursor-pointer text-sm font-semibold text-foreground underline-offset-2 hover:underline"
              onClick={() => navigate(routes.productReviews(id))}
            >
              {t('page.viewReviews')}
            </button>
            <div className="mt-4">
              <ProductPriceBlock product={product} priceSize="xl" />
            </div>
            <div className="mt-5 mb-2 text-sm font-extrabold">{t('page.characteristics')}</div>
            <div className="text-sm leading-loose text-muted-foreground">
              <div><strong className="text-[rgba(0,0,0,0.85)]">{t('page.specs.color')}:</strong> {t('page.specs.colorValue')}</div>
              <div><strong className="text-[rgba(0,0,0,0.85)]">{t('page.specs.storage')}:</strong> {t('page.specs.storageValue')}</div>
              <div><strong className="text-[rgba(0,0,0,0.85)]">{t('page.specs.screen')}:</strong> {t('page.specs.screenValue')}</div>
            </div>
          </div>
          {!isMobile && (
            <aside className="flex flex-col gap-2 rounded-xl border border-black/10 p-[18px]">
              <ProductBuyPanel
                onBuy={() => buyNow(id)}
                onAdd={() => addCurrentToCart(id)}
                deliveryLabel={deliveryLabel}
                isExpressProduct={product.full}
              />
            </aside>
          )}
        </PanelCard>
      </div>
      {isMobile && (
        <>
          <div className="mb-3 rounded-lg bg-black/[0.03] px-3 py-2 text-[13px] text-muted-foreground">
            {deliveryLabel}
          </div>
          <MobileProductBar onBuy={() => buyNow(id)} onAdd={() => addCurrentToCart(id)} />
        </>
      )}
    </>
  );
}
