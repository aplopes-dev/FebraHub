'use client';

import { cn } from '@citybox/ui';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@citybox/ui/atoms';
import { PlanBrlCurrencyInput } from '@/features/clinic/modules/settings/plans/components/plan-brl-currency-input';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  calculateInstallmentAmountCents,
  calculateInstallmentBalanceCents,
  calculatePatientBudgetDiscountCents,
  calculatePatientBudgetFinalCents,
  parseBrlCurrencyToCents,
  parsePositiveInteger,
} from '../../../lib/patient-budget-form-utils';
import type {
  PatientBudgetDiscount,
  PatientBudgetDiscountType,
  PatientBudgetInstallment,
  PatientBudgetPrintSettings,
  PatientBudgetRejectionDraft,
  PatientBudgetStatusSelection,
} from '../../../types/patient-budget-form';
import { PatientBudgetSettingsSection } from './patient-budget-settings-section';

type PatientBudgetSummaryPanelProps = {
  subtotalCents: number;
  discount: PatientBudgetDiscount | null;
  showDiscount: boolean;
  installment: PatientBudgetInstallment;
  observations: string;
  showStatusSelect: boolean;
  statusSelection: PatientBudgetStatusSelection;
  rejection: PatientBudgetRejectionDraft;
  emitContractOnApprove: boolean;
  printSettings: PatientBudgetPrintSettings;
  disabled?: boolean;
  onAddDiscount: () => void;
  onDiscountChange: (discount: PatientBudgetDiscount) => void;
  onRemoveDiscount: () => void;
  onInstallmentChange: (installment: PatientBudgetInstallment) => void;
  onObservationsChange: (observations: string) => void;
  onStatusSelectionChange: (status: PatientBudgetStatusSelection) => void;
  onRejectionChange: (rejection: PatientBudgetRejectionDraft) => void;
  onEmitContractOnApproveChange: (enabled: boolean) => void;
  onPrintSettingsChange: (settings: PatientBudgetPrintSettings) => void;
  rejectionDateError?: string;
  rejectionReasonError?: string;
  className?: string;
};

export function PatientBudgetSummaryPanel({
  subtotalCents,
  discount,
  showDiscount,
  installment,
  observations,
  showStatusSelect,
  statusSelection,
  rejection,
  emitContractOnApprove,
  printSettings,
  disabled = false,
  onAddDiscount,
  onDiscountChange,
  onRemoveDiscount,
  onInstallmentChange,
  onObservationsChange,
  onStatusSelectionChange,
  onRejectionChange,
  onEmitContractOnApproveChange,
  onPrintSettingsChange,
  rejectionDateError,
  rejectionReasonError,
  className,
}: PatientBudgetSummaryPanelProps) {
  const discountCents = calculatePatientBudgetDiscountCents(subtotalCents, discount);
  const finalCents = calculatePatientBudgetFinalCents(subtotalCents, discount);
  const downPaymentCents = parseBrlCurrencyToCents(installment.downPayment);
  const installmentsCount = parsePositiveInteger(installment.installmentsCount);
  const balanceCents = calculateInstallmentBalanceCents(finalCents, downPaymentCents);
  const installmentAmountCents = calculateInstallmentAmountCents(balanceCents, installmentsCount);

  const handleDiscountTypeChange = (type: PatientBudgetDiscountType) => {
    if (!discount) return;
    onDiscountChange({
      type,
      value: type === 'fixed' ? 'R$ 0,00' : '',
    });
  };

  const handleInstallmentToggle = (checked: boolean) => {
    onInstallmentChange({
      ...installment,
      enabled: checked,
    });
  };

  return (
    <aside
      className={cn(
        'flex w-full shrink-0 flex-col border-border/60 bg-card/40 px-8 py-6 lg:w-[36rem] lg:border-l',
        className,
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Valor total orçamento</span>
          <span className="text-sm font-medium text-foreground">
            {formatBrlCurrencyFromCents(subtotalCents)}
          </span>
        </div>

        {!showDiscount ? (
          <button
            type="button"
            className="text-left text-sm font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            disabled={disabled}
            onClick={onAddDiscount}
          >
            Adicionar desconto
          </button>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="patient-budget-discount-type" className="sr-only">
                  Tipo de desconto
                </Label>
                <Select
                  value={discount?.type ?? 'fixed'}
                  onValueChange={(value) =>
                    handleDiscountTypeChange(value as PatientBudgetDiscountType)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger id="patient-budget-discount-type" className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">R$</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="patient-budget-discount-value" className="sr-only">
                  Valor do desconto
                </Label>
                {discount?.type === 'percent' ? (
                  <Input
                    id="patient-budget-discount-value"
                    value={discount.value}
                    onChange={(event) =>
                      onDiscountChange({
                        type: 'percent',
                        value: event.target.value.replace(/[^\d.,]/g, ''),
                      })
                    }
                    placeholder="Valor"
                    inputMode="decimal"
                    disabled={disabled}
                  />
                ) : (
                  <PlanBrlCurrencyInput
                    id="patient-budget-discount-value"
                    value={discount?.value ?? 'R$ 0,00'}
                    onValueChange={(value) =>
                      onDiscountChange({
                        type: 'fixed',
                        value,
                      })
                    }
                    disabled={disabled}
                  />
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 px-2"
                disabled={disabled}
                onClick={onRemoveDiscount}
              >
                Remover
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-semibold text-foreground">
              {formatBrlCurrencyFromCents(finalCents)}
            </span>
          </div>
          {discountCents > 0 ? (
            <p className="text-right text-xs text-muted-foreground">
              Desconto: -{formatBrlCurrencyFromCents(discountCents)}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <Checkbox
              id="patient-budget-installment"
              checked={installment.enabled}
              disabled={disabled}
              onCheckedChange={(checked) => handleInstallmentToggle(checked === true)}
            />
            <Label htmlFor="patient-budget-installment" className="text-sm font-medium">
              Parcelar orçamento
            </Label>
          </div>

          {installment.enabled ? (
            <div className="text-sm text-foreground">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-2 leading-relaxed">
                <span>Entrada de</span>
                <PlanBrlCurrencyInput
                  id="patient-budget-down-payment"
                  className="h-9 w-28 shrink-0"
                  value={installment.downPayment}
                  onValueChange={(downPayment) =>
                    onInstallmentChange({ ...installment, downPayment })
                  }
                  disabled={disabled}
                />
                <span className="whitespace-nowrap">
                  com saldo de{' '}
                  <span className="font-medium">{formatBrlCurrencyFromCents(balanceCents)}</span>
                </span>
                <span className="inline-flex items-center gap-x-1.5 whitespace-nowrap">
                  <span>parcelar em</span>
                  <Input
                    id="patient-budget-installments-count"
                    className="h-9 w-16 shrink-0"
                    value={installment.installmentsCount}
                    onChange={(event) =>
                      onInstallmentChange({
                        ...installment,
                        installmentsCount: event.target.value.replace(/\D/g, ''),
                      })
                    }
                    placeholder="0"
                    inputMode="numeric"
                    disabled={disabled}
                  />
                  <span>
                    vezes de{' '}
                    <span className="font-medium">
                      {formatBrlCurrencyFromCents(installmentAmountCents)}
                    </span>
                  </span>
                </span>
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="patient-budget-observations" className="sr-only">
              Observações
            </Label>
            <Textarea
              id="patient-budget-observations"
              value={observations}
              onChange={(event) => onObservationsChange(event.target.value)}
              placeholder="Observações"
              disabled={disabled}
              className="min-h-24 resize-y"
            />
          </div>
        </div>

        <PatientBudgetSettingsSection
          showStatusSelect={showStatusSelect}
          statusSelection={statusSelection}
          rejection={rejection}
          emitContractOnApprove={emitContractOnApprove}
          printSettings={printSettings}
          installmentEnabled={installment.enabled}
          disabled={disabled}
          rejectionDateError={rejectionDateError}
          rejectionReasonError={rejectionReasonError}
          onStatusSelectionChange={onStatusSelectionChange}
          onRejectionChange={onRejectionChange}
          onEmitContractOnApproveChange={onEmitContractOnApproveChange}
          onPrintSettingsChange={onPrintSettingsChange}
        />
      </div>
    </aside>
  );
}
