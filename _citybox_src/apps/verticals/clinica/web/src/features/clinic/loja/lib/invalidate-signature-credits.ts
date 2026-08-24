import type { QueryClient } from '@tanstack/react-query';
import { signaturePackagesKeys } from '@/features/clinic/loja/hooks/query-keys';

/** Invalida o saldo de créditos após envio ZapSign (ou liberação vista na Loja). */
export function invalidateSignatureCredits(
  queryClient: QueryClient,
  storeId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: signaturePackagesKeys.credits(storeId),
  });
}
