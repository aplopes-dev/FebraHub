import { ClinicaApiError } from '@/features/clinic/shared/api';
import { getSignatureCredits } from '../services/signature-packages.api.service';

/** Mensagem canônica (espelha `SignatureCreditsInsufficientError` na API). */
export const SIGNATURE_CREDITS_INSUFFICIENT_MESSAGE =
  'Saldo de assinaturas insuficiente. Solicite um pacote de assinatura eletrônica na Loja.';

export function isSignatureCreditsInsufficientError(error: unknown): boolean {
  if (!(error instanceof ClinicaApiError) && !(error instanceof Error)) {
    return false;
  }
  return error.message.includes('Saldo de assinaturas insuficiente');
}

/** true = abrir o modal da Loja sem enviar o PDF (evita 413 com saldo 0). */
export async function isSignatureCreditBalanceEmpty(storeId: string): Promise<boolean> {
  try {
    const credits = await getSignatureCredits(storeId);
    return credits.balance < 1;
  } catch {
    return false;
  }
}
