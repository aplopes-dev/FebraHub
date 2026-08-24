'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@citybox/ui/atoms';
import {
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
  CLINIC_NESTED_SHEET_CONTENT_CLASS,
  CLINIC_SHEET_BODY_PADDING_CLASS,
  CLINIC_SHEET_FOOTER_BUTTON_CLASS,
  CLINIC_SHEET_FOOTER_CLASS,
  CLINIC_SHEET_HEADER_CLASS,
  CLINIC_SHEET_SCROLL_BODY_CLASS,
} from '@/features/clinic/lib/clinic-sheet-styles';
import { useFinancialAccounts } from '@/features/clinic/financeiro/hooks/use-financial-accounts';
import { formatCentsToBrlInput } from '../../../lib/patient-budget-form-utils';
import { validatePatientFinancialReceiveForm } from '../../../lib/validate-patient-financial-receive-form';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';
import {
  EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
  type PatientFinancialReceiveFormValues,
} from '../../../types/patient-financial-receive-form';
import { PatientFinancialReceiveEntrySummary } from './patient-financial-receive-entry-summary';
import { PatientFinancialReceivePaymentFields } from './patient-financial-receive-payment-fields';
import { PatientFinancialReceivePaymentMethodPicker } from './patient-financial-receive-payment-method-picker';

type PatientFinancialReceiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: PatientFinancialEntry | null;
  onConfirm: (entryId: string, values: PatientFinancialReceiveFormValues) => Promise<void>;
};

export function PatientFinancialReceiveSheet({
  open,
  onOpenChange,
  entry,
  onConfirm,
}: PatientFinancialReceiveSheetProps) {
  const [values, setValues] = useState<PatientFinancialReceiveFormValues>(
    EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
  );
  const [isSaving, setIsSaving] = useState(false);
  const { data: accounts } = useFinancialAccounts();

  const cashRegisters = useMemo(
    () => (accounts ?? []).map((account) => ({ id: account.id, name: account.name })),
    [accounts],
  );

  const defaultCashRegisterId = cashRegisters[0]?.id ?? '';

  useEffect(() => {
    if (!open || !entry) {
      return;
    }

    setValues({
      ...EMPTY_PATIENT_FINANCIAL_RECEIVE_FORM_VALUES,
      paidAmount: formatCentsToBrlInput(entry.valueCents),
      receivedDate: new Date(),
      cashRegisterId: defaultCashRegisterId,
    });
  }, [open, entry, defaultCashRegisterId]);

  const patchValues = useCallback((partial: Partial<PatientFinancialReceiveFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
  }, []);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!entry) {
      return;
    }

    const validationError = validatePatientFinancialReceiveForm(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!values.receivedDate) {
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm(entry.id, values);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!entry) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
          CLINIC_NESTED_SHEET_CONTENT_CLASS,
          // No tablet (768), max-w-3xl + inset right-4 corta o painel — limitar à viewport.
          'min-w-0 data-[side=right]:max-w-[calc(100%-2rem)] data-[side=right]:sm:max-w-[min(42rem,calc(100%-2rem))] data-[side=right]:lg:max-w-3xl',
        )}
      >
        <SheetHeader className={cn(CLINIC_SHEET_HEADER_CLASS, 'flex-row items-center justify-between')}>
          <SheetTitle>Registrar Recebimento</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            disabled={isSaving}
            onClick={handleClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </SheetHeader>

        <div className={cn('relative', CLINIC_SHEET_SCROLL_BODY_CLASS)}>
          {isSaving ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Registrando recebimento…
              </div>
            </div>
          ) : null}

          <div className={CLINIC_SHEET_BODY_PADDING_CLASS}>
            <PatientFinancialReceiveEntrySummary entry={entry} />

            <div className="mt-8 space-y-2">
              <p className="text-sm font-medium text-foreground">Meios de pagamento</p>
              <PatientFinancialReceivePaymentMethodPicker
                value={values.paymentMethod}
                disabled={isSaving}
                onChange={(paymentMethod) => patchValues({ paymentMethod })}
              />
            </div>

            <div className="mt-6">
              <PatientFinancialReceivePaymentFields
                values={values}
                disabled={isSaving}
                cashRegisters={cashRegisters}
                onChange={patchValues}
              />
            </div>
          </div>
        </div>

        <SheetFooter className={CLINIC_SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="ghost"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isSaving}
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={CLINIC_SHEET_FOOTER_BUTTON_CLASS}
            disabled={isSaving || cashRegisters.length === 0}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
