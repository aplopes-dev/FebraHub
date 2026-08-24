'use client';

import { Input } from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';

export type ProductPricingFormValues = {
  /** Preço de venda em reais. */
  price: number;
  /** Preço para viagem em reais. */
  takeawayPrice: number;
  /** Imposto em percentual (0–100). */
  taxPercent: number;
};

export type ProductPricingFormErrors = {
  price?: boolean;
};

type ProductFormStepPricingProps = {
  values: ProductPricingFormValues;
  errors: ProductPricingFormErrors;
  onChange: (next: ProductPricingFormValues) => void;
};

function parseTaxPercent(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return Math.min(100, Number.parseInt(digits, 10));
}

/**
 * Etapa 2 do modal Adicionar Produto — preço, takeaway e imposto.
 */
export function ProductFormStepPricing({
  values,
  errors,
  onChange,
}: ProductFormStepPricingProps) {
  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-bold text-[#171717]">Precificação</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">
          Preço <span className="text-[#ef4444]">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
            R$
          </span>
          <CurrencyInput
            value={values.price}
            onValueChange={(price) => onChange({ ...values, price })}
            aria-invalid={Boolean(errors.price)}
            className="!pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">Preço para viagem</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
            R$
          </span>
          <CurrencyInput
            value={values.takeawayPrice}
            onValueChange={(takeawayPrice) => onChange({ ...values, takeawayPrice })}
            className="!pl-10"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">Imposto</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
            %
          </span>
          <Input
            inputMode="numeric"
            value={String(values.taxPercent)}
            onChange={(event) =>
              onChange({ ...values, taxPercent: parseTaxPercent(event.target.value) })
            }
            className="!pl-10"
          />
        </div>
      </div>
    </div>
  );
}
