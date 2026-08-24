'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@citybox/ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@citybox/ui/atoms';
import { DatePickerField } from '../../_ui/fields';
import { FinancialAccountSelect } from '../../components/financial-account-select/financial-account-select';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import {
  EMPTY_BRL_CURRENCY,
  formatBrlCurrencyFromCents,
} from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { parseBrlCurrencyToCents } from '@/features/clinic/modules/patients/lib/patient-budget-form-utils';
import {
  COMMISSION_PAYMENT_METHOD_OPTIONS,
  type CommissionPayFormValues,
  type CommissionPaymentMethod,
  type CommissionSummaryRow,
} from '../types/commission-financial.types';

function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    cents / 100,
  );
}

function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function createInitialValues(row: CommissionSummaryRow): CommissionPayFormValues {
  return {
    description: `Comissão ${row.professionalName}`,
    commissionValueCents: row.totalCents,
    paymentDate: todayIso(),
    accountId: '',
    paymentMethod: 'pix',
    hasDiscount: false,
    discountCents: 0,
    observation: '',
  };
}

type CommissionPayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: CommissionSummaryRow | null;
  onConfirm: (values: CommissionPayFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

export function CommissionPayDialog({
  open,
  onOpenChange,
  row,
  onConfirm,
  isSubmitting = false,
}: CommissionPayDialogProps) {
  const [values, setValues] = useState<CommissionPayFormValues | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [discountInput, setDiscountInput] = useState(EMPTY_BRL_CURRENCY);

  useEffect(() => {
    if (open && row) {
      setValues(createInitialValues(row));
      setPaymentDate(new Date());
      setDiscountInput(EMPTY_BRL_CURRENCY);
    }
  }, [open, row]);

  const patch = (partial: Partial<CommissionPayFormValues>) => {
    setValues((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const discountCents = useMemo(
    () => parseBrlCurrencyToCents(discountInput),
    [discountInput],
  );

  const netValueCents = useMemo(() => {
    if (!values) return 0;
    if (!values.hasDiscount) return values.commissionValueCents;
    return Math.max(0, values.commissionValueCents - discountCents);
  }, [values, discountCents]);

  const handleConfirm = () => {
    if (!values) return;
    onConfirm({
      ...values,
      paymentDate: format(paymentDate, 'yyyy-MM-dd'),
      discountCents: values.hasDiscount ? discountCents : 0,
    });
  };

  if (!values || !row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pagamento de comissão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="commission-pay-description">Descrição</Label>
            <Input
              id="commission-pay-description"
              value={values.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>

          {/* Comissão a pagar (não editável) */}
          <div className="space-y-1.5">
            <Label>Comissão a pagar</Label>
            <Input
              value={formatBrl(values.commissionValueCents)}
              disabled
              className="bg-muted/50"
              aria-label="Valor da comissão a pagar"
            />
          </div>

          {/* Data do pagamento */}
          <DatePickerField
            label="Data do pagamento"
            value={paymentDate}
            onChange={(date) => date && setPaymentDate(date)}
          />

          {/* Conta financeira */}
          <div className="space-y-1.5">
            <FinancialAccountSelect
              label="Conta financeira"
              value={values.accountId || null}
              onValueChange={(id) => patch({ accountId: id })}
            />
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-1.5">
            <Label htmlFor="commission-pay-method">Forma de pagamento</Label>
            <Select
              value={values.paymentMethod}
              onValueChange={(v) => patch({ paymentMethod: v as CommissionPaymentMethod })}
            >
              <SelectTrigger id="commission-pay-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMISSION_PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle desconto */}
          <div className="flex items-center gap-3">
            <Switch
              id="commission-pay-discount-toggle"
              checked={values.hasDiscount}
              onCheckedChange={(checked) => {
                patch({
                  hasDiscount: checked,
                  ...(checked ? {} : { observation: '' }),
                });
                if (!checked) setDiscountInput(EMPTY_BRL_CURRENCY);
              }}
            />
            <Label htmlFor="commission-pay-discount-toggle" className="font-normal">
              Desconto
            </Label>
          </div>

          {values.hasDiscount ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="commission-pay-discount">Desconto (R$)</Label>
                <PlanBrlCurrencyInput
                  value={discountInput}
                  onValueChange={setDiscountInput}
                  aria-label="Valor do desconto"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="commission-pay-obs">Observação</Label>
                <Textarea
                  id="commission-pay-obs"
                  value={values.observation}
                  onChange={(e) => patch({ observation: e.target.value })}
                  rows={2}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Valor total a pagar de comissão</Label>
                <Input
                  value={formatBrl(netValueCents)}
                  disabled
                  className={cn(
                    'bg-muted/50 font-semibold',
                    netValueCents < values.commissionValueCents && 'text-green-700',
                  )}
                  aria-label="Valor total a pagar"
                />
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              isSubmitting ||
              !values.description.trim() ||
              !values.accountId
            }
          >
            {isSubmitting ? 'Pagando…' : 'Pagar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
