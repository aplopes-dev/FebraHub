import type { LucideIcon } from 'lucide-react';
import { CreditCard, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PixIcon } from '@/components/icons/pix-icon';
import { cn } from '@/lib/utils';
import type { PayMethod } from '@/types';

export type PaymentOptionConfig = {
  id: PayMethod;
  title: string;
  subtitle: string;
  icon: LucideIcon | 'pix';
  discountLabel?: string;
};

export function usePaymentOptions(): PaymentOptionConfig[] {
  const { t } = useTranslation('catalog');
  return [
    {
      id: 'pix',
      title: t('payment.pix'),
      subtitle: t('payment.pixSubtitle'),
      icon: 'pix',
      discountLabel: t('payment.pixDiscountBadge'),
    },
    {
      id: 'card',
      title: t('payment.card'),
      subtitle: t('payment.cardSubtitle'),
      icon: CreditCard,
    },
    {
      id: 'boleto',
      title: t('payment.boleto'),
      subtitle: t('payment.boletoSubtitle'),
      icon: FileText,
    },
  ];
}

function PaymentOptionIcon({
  icon,
  selected,
}: {
  icon: LucideIcon | 'pix';
  selected: boolean;
}) {
  const className = cn('size-5', selected ? 'text-success' : 'text-muted-foreground');
  if (icon === 'pix') return <PixIcon className={className} />;
  const Icon = icon;
  return <Icon className={className} strokeWidth={2} aria-hidden />;
}

export function PaymentOptionRow({
  option,
  selected,
  onSelect,
}: {
  option: PaymentOptionConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors',
        selected ? 'border-[1.5px] border-success bg-success/10' : 'border border-black/10 bg-white',
      )}
    >
      <span
        className={cn(
          'relative flex size-[22px] shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-success' : 'border-black/25',
        )}
      >
        {selected && <span className="size-3 rounded-full bg-success" />}
      </span>

      <span className="flex w-7 shrink-0 items-center justify-center">
        <PaymentOptionIcon icon={option.icon} selected={selected} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground">{option.title}</span>
        {option.subtitle && (
          <span className="block text-xs text-muted-foreground">{option.subtitle}</span>
        )}
      </span>

      {option.discountLabel && (
        <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
          {option.discountLabel}
        </span>
      )}
    </button>
  );
}

export function PaymentMethodOptions({
  pay,
  onChange,
}: {
  pay: PayMethod;
  onChange: (p: PayMethod) => void;
}) {
  const options = usePaymentOptions();

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <PaymentOptionRow
          key={option.id}
          option={option}
          selected={pay === option.id}
          onSelect={() => onChange(option.id)}
        />
      ))}
    </div>
  );
}
