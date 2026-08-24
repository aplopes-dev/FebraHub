'use client';

import { cn } from '@citybox/ui';
import {
  getPatientFinancialPaymentMethodSizeClass,
  PATIENT_FINANCIAL_PAYMENT_METHODS,
} from '../../../lib/patient-financial-receive-payment-methods';
import type { PatientFinancialPaymentMethod } from '../../../types/patient-financial-receive-form';

type PatientFinancialReceivePaymentMethodPickerProps = {
  value: PatientFinancialPaymentMethod;
  disabled?: boolean;
  onChange: (method: PatientFinancialPaymentMethod) => void;
};

export function PatientFinancialReceivePaymentMethodPicker({
  value,
  disabled = false,
  onChange,
}: PatientFinancialReceivePaymentMethodPickerProps) {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-2',
        'sm:flex sm:min-w-0 sm:grid-cols-none sm:flex-nowrap sm:gap-0 sm:overflow-x-auto sm:rounded-lg sm:border sm:border-border sm:bg-input/50',
      )}
      role="group"
      aria-label="Meios de pagamento"
    >
      {PATIENT_FINANCIAL_PAYMENT_METHODS.map((method, index) => {
        const Icon = method.icon;
        const isSelected = value === method.id;

        return (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              'flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border px-2 text-sm font-medium whitespace-nowrap transition-colors',
              'sm:h-9 sm:rounded-none sm:border-0 sm:border-border',
              getPatientFinancialPaymentMethodSizeClass(method.size),
              index > 0 && 'sm:border-l',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-input/50 text-foreground hover:bg-muted/60 sm:bg-transparent',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            onClick={() => onChange(method.id)}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate" title={method.label}>
              {method.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
