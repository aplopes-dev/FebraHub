import {
  ArrowLeftRight,
  Banknote,
  Barcode,
  CreditCard,
  QrCode,
  ScrollText,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import type { PatientFinancialPaymentMethod } from '../types/patient-financial-receive-form';

export type PatientFinancialPaymentMethodSize = 'compact' | 'default' | 'wide';

export type PatientFinancialPaymentMethodOption = {
  id: PatientFinancialPaymentMethod;
  label: string;
  icon: LucideIcon;
  size?: PatientFinancialPaymentMethodSize;
};

export const PATIENT_FINANCIAL_PAYMENT_METHODS: PatientFinancialPaymentMethodOption[] = [
  { id: 'cash', label: 'Dinheiro', icon: Banknote },
  { id: 'credit', label: 'Crédito', icon: CreditCard },
  { id: 'debit', label: 'Débito', icon: WalletCards },
  { id: 'pix', label: 'Pix', icon: QrCode, size: 'compact' },
  { id: 'transfer', label: 'Transferência', icon: ArrowLeftRight, size: 'wide' },
  { id: 'boleto', label: 'Boleto', icon: Barcode },
  { id: 'check', label: 'Cheque', icon: ScrollText },
];

const PAYMENT_METHOD_IDS = new Set<string>(
  PATIENT_FINANCIAL_PAYMENT_METHODS.map((method) => method.id),
);

export function isPatientFinancialPaymentMethod(
  value: string | null | undefined,
): value is PatientFinancialPaymentMethod {
  return typeof value === 'string' && PAYMENT_METHOD_IDS.has(value);
}

export function getPatientFinancialPaymentMethodLabel(
  method: string | null | undefined,
): string | null {
  if (!isPatientFinancialPaymentMethod(method)) {
    return null;
  }

  return (
    PATIENT_FINANCIAL_PAYMENT_METHODS.find((option) => option.id === method)?.label ??
    null
  );
}

/** Cores suaves do badge na listagem de débitos (fundo + texto + borda). */
const PAYMENT_METHOD_BADGE_CLASS: Record<PatientFinancialPaymentMethod, string> = {
  cash: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  credit:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  debit:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  pix: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
  transfer:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  boleto:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  check:
    'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300',
};

export function getPatientFinancialPaymentMethodBadgeClass(
  method: string | null | undefined,
): string | null {
  if (!isPatientFinancialPaymentMethod(method)) {
    return null;
  }

  return PAYMENT_METHOD_BADGE_CLASS[method];
}

const PAYMENT_METHOD_SIZE_CLASS: Record<PatientFinancialPaymentMethodSize, string> = {
  compact: 'sm:flex-[0.6] sm:px-1.5',
  default: 'sm:flex-1 sm:px-2',
  wide: 'sm:flex-[1.55] sm:px-2',
};

export function getPatientFinancialPaymentMethodSizeClass(
  size: PatientFinancialPaymentMethodSize = 'default',
): string {
  return PAYMENT_METHOD_SIZE_CLASS[size];
}
