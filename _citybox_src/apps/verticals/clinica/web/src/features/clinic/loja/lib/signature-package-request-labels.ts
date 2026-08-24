import type { SignaturePackageRequest } from '../services/signature-packages.api.service';

export type SignaturePackageRequestStatus =
  SignaturePackageRequest['status'];

export const SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL: Record<
  SignaturePackageRequestStatus,
  string
> = {
  pending: 'Pendente',
  liberado: 'Aprovado',
  cancelado: 'Recusado',
};

export const SIGNATURE_PACKAGE_REQUEST_STATUS_BADGE_CLASS: Record<
  SignaturePackageRequestStatus,
  string
> = {
  pending:
    'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200',
  liberado:
    'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200',
  cancelado:
    'border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200',
};

/** Rótulo do pacote a partir da quantidade persistida na solicitação. */
export function formatSignaturePackageRequestPackageLabel(
  quantity: number,
): string {
  return `${quantity} assinaturas`;
}

/** Data de solicitação em calendário local (dd/MM/yyyy). */
export function formatSignaturePackageRequestDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}
