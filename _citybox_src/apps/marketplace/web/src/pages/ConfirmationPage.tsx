import { useNavigate } from 'react-router-dom';
import { screenLabel } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { useCheckout } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { OrderConfirmationCard } from '@/components/account/account-components';
import { PanelCard, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { routes } from '@/lib/routes';

export function ConfirmationPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { order, selectedShipping } = useCheckout();
  const { isMobile, detailCols } = useLayout();
  const arrivalText = selectedShipping.deliveryEstimate;

  if (isMobile) {
    return (
      <div data-screen-label={screenLabel('confirmation')} className="flex justify-center py-[clamp(20px,5vw,48px)]">
        <OrderConfirmationCard
          orderNo={order?.no}
          totalFmt={order?.totalFmt}
          arrivalText={arrivalText}
          onTrack={() =>
            order?.no ? navigate(routes.orderTracking(order.no)) : navigate(routes.orders)
          }
          onHome={() => navigate(routes.home)}
        />
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('confirmation')} className="py-[clamp(20px,5vw,48px)]">
      <TwoColumnLayout columns={detailCols} className="items-center gap-8">
        <OrderConfirmationCard
          orderNo={order?.no}
          totalFmt={order?.totalFmt}
          arrivalText={arrivalText}
          onTrack={() =>
            order?.no ? navigate(routes.orderTracking(order.no)) : navigate(routes.orders)
          }
          onHome={() => navigate(routes.home)}
        />
        <PanelCard className="p-6">
          <h2 className="m-0 mb-3 text-lg font-extrabold">{t('confirmation.nextStepsTitle')}</h2>
          <ol className="m-0 flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>{t('confirmation.nextSteps.email')}</li>
            <li>{t('confirmation.nextSteps.track')}</li>
            <li>{t('confirmation.nextSteps.delivery', { arrivalText: arrivalText.toLowerCase() })}</li>
          </ol>
        </PanelCard>
      </TwoColumnLayout>
    </div>
  );
}
