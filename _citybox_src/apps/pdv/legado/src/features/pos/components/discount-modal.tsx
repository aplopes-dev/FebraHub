'use client';

import { useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  ScrollArea,
} from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';
import { preventDialogDismissOnToast } from '@/components/toast';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import { usePosStore } from '../hooks/use-pos-store';
import { PosTabs } from './pos-tabs';

type DiscountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DiscountMode = 'new' | 'predefined' | 'percentage' | 'price';

const TAB_OPTIONS: readonly { id: DiscountMode; label: string }[] = [
  { id: 'new', label: 'Novo' },
  { id: 'predefined', label: 'Predefinido' },
  { id: 'percentage', label: 'Por Porcentagem' },
  { id: 'price', label: 'Por preço' },
] as const;

type PredefinedDiscount = {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage or cents
};

const PREDEFINED_DISCOUNTS: readonly PredefinedDiscount[] = [
  { id: 'new-year-2025', name: '2025 desconto de ano novo', type: 'percentage', value: 25 },
  { id: 'mon-5-off', name: 'R$ 5 OFF segunda feira', type: 'fixed', value: 500 },
  { id: 'member-10', name: 'Desconto de Membro', type: 'percentage', value: 10 },
  { id: 'cash-back-15', name: 'Retorno Especial', type: 'fixed', value: 1500 },
] as const;

function parseCouponDiscount(code: string): { name: string; type: 'percentage' | 'fixed'; value: number } {
  const normalized = code.trim().toUpperCase();
  if (normalized.endsWith('20') || normalized.includes('20')) {
    return { name: `Cupom: ${normalized}`, type: 'percentage', value: 20 };
  }
  if (normalized.endsWith('50') || normalized.includes('50')) {
    return { name: `Cupom: ${normalized}`, type: 'fixed', value: 5000 };
  }
  return { name: `Cupom: ${normalized}`, type: 'percentage', value: 10 };
}

export function DiscountModal({ open, onOpenChange }: DiscountModalProps) {
  const activeDiscount = usePosStore((state) => state.activeDiscount);
  const setDiscount = usePosStore((state) => state.setDiscount);

  // Initialize state based on the active discount inside initializer functions
  const [mode, setMode] = useState<DiscountMode>(() => {
    return activeDiscount ? activeDiscount.type : 'new';
  });

  const [couponCode, setCouponCode] = useState(() => {
    return activeDiscount && activeDiscount.type === 'new' ? (activeDiscount.code || '') : '';
  });

  const [selectedPredefinedId, setSelectedPredefinedId] = useState<string | null>(() => {
    if (activeDiscount && activeDiscount.type === 'predefined') {
      const matched = PREDEFINED_DISCOUNTS.find((d) => d.name === activeDiscount.name);
      return matched?.id || null;
    }
    return null;
  });

  const [percentage, setPercentage] = useState(() => {
    return activeDiscount && activeDiscount.type === 'percentage' ? activeDiscount.value.toString() : '';
  });

  const [priceVal, setPriceVal] = useState<number>(() => {
    return activeDiscount && activeDiscount.type === 'price' ? activeDiscount.value / 100 : 0;
  });

  const canConfirmNew = couponCode.trim().length > 0;
  const canConfirmPredefined = selectedPredefinedId !== null;
  const canConfirmPercentage = 
    percentage.trim().length > 0 && 
    !isNaN(Number(percentage)) && 
    Number(percentage) > 0 && 
    Number(percentage) <= 100;
  const canConfirmPrice = priceVal > 0;

  const canConfirm =
    (mode === 'new' && canConfirmNew) ||
    (mode === 'predefined' && canConfirmPredefined) ||
    (mode === 'percentage' && canConfirmPercentage) ||
    (mode === 'price' && canConfirmPrice);

  const handleConfirm = () => {
    if (mode === 'new') {
      const code = couponCode.trim();
      if (!code) return;
      const parsed = parseCouponDiscount(code);
      setDiscount({
        type: 'new',
        calculationType: parsed.type,
        value: parsed.value,
        name: parsed.name,
        code,
      });
    } else if (mode === 'predefined') {
      const selected = PREDEFINED_DISCOUNTS.find((d) => d.id === selectedPredefinedId);
      if (!selected) return;
      setDiscount({
        type: 'predefined',
        calculationType: selected.type,
        value: selected.value,
        name: selected.name,
      });
    } else if (mode === 'percentage') {
      const val = Number(percentage);
      setDiscount({
        type: 'percentage',
        calculationType: 'percentage',
        value: val,
        name: `Desconto ${val}%`,
      });
    } else if (mode === 'price') {
      const val = priceVal;
      const cents = Math.round(val * 100);
      setDiscount({
        type: 'price',
        calculationType: 'fixed',
        value: cents,
        name: `Desconto R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className="flex w-full max-w-[540px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[540px]"
      >
        <DialogTitle className="sr-only">Desconto</DialogTitle>

        <div className="relative flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">Desconto</h2>
        </div>

        <div className="flex h-[480px] flex-col bg-[#F7F7F7] text-[#171717]">
          <div className="shrink-0 px-8 pt-5">
            <PosTabs
              options={TAB_OPTIONS}
              value={mode}
              onChange={setMode}
              layoutGroupId="pdv-discount-mode"
            />
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-8 pb-5">
            {mode === 'new' && (
              <div className="flex flex-col gap-4">
                <Field label="Código do desconto">
                  <Input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Ex: CUPOM10, DESCONTO20"
                    className="h-11 rounded-xl border-[#e5e5e5] bg-white text-sm"
                  />
                </Field>
              </div>
            )}

            {mode === 'predefined' && (
              <div className="flex min-h-0 flex-1 flex-col">
                <ScrollArea
                  type="scroll"
                  className="pdv-customers-scroll -mr-5 min-h-0 flex-1 overflow-hidden overscroll-none"
                >
                  <ul className="divide-y divide-[#e5e5e5]/80">
                    {PREDEFINED_DISCOUNTS.map((discount) => {
                      const isSelected = selectedPredefinedId === discount.id;
                      const valueDisplay =
                        discount.type === 'percentage'
                          ? `-${discount.value}%`
                          : `-${formatCatalogPrice(discount.value)}`;

                      return (
                        <li key={discount.id}>
                          <button
                            type="button"
                            className={`flex w-full items-center justify-between gap-3 px-1 py-3.5 pr-5 text-left transition-colors ${
                              isSelected
                                ? 'bg-primary/5'
                                : 'hover:bg-black/[0.03] active:bg-black/[0.05]'
                            }`}
                            onClick={() => setSelectedPredefinedId(discount.id)}
                          >
                            <span
                              className={`min-w-0 truncate text-[15px] font-semibold ${
                                isSelected ? 'text-primary' : 'text-[#171717]'
                              }`}
                            >
                              {discount.name}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-[#737373]">
                              {valueDisplay}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {mode === 'percentage' && (
              <div className="flex flex-col gap-4">
                <Field label="Porcentagem (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(event) => setPercentage(event.target.value)}
                    placeholder="Digite a porcentagem (Ex: 10)"
                    className="h-11 rounded-xl border-[#e5e5e5] bg-white text-sm"
                  />
                </Field>
              </div>
            )}

            {mode === 'price' && (
              <div className="flex flex-col gap-4">
                <Field label="Valor (R$)">
                  <CurrencyInput
                    value={priceVal}
                    onValueChange={setPriceVal}
                    placeholder="Digite o valor (Ex: 15,00)"
                    className="h-11 rounded-xl border-[#e5e5e5] bg-white text-sm"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 border-t border-[#E5E5E5] bg-white px-8 py-4">
          <button
            type="button"
            className="pdv-gradient-border-btn flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-[#171717]"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            className="pdv-primary-gradient-btn flex h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
          >
            Adicionar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-semibold">{label}</span>
      {children}
    </label>
  );
}
