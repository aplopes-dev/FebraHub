import type { SignatureCreditBalance } from '../../../../domain/entities/signature-credit-balance.entity';
import type { SignaturePackageRequest } from '../../../../domain/entities/signature-package-request.entity';

export type SignatureCreditBalanceResponse = {
  storeId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export type SignaturePackageRequestResponse = {
  id: string;
  storeId: string;
  packageId: string;
  quantity: number;
  priceCents: number;
  status: 'pending' | 'liberado' | 'cancelado';
  createdAt: string;
  liberatedAt: string | null;
};

export function toSignatureCreditBalanceResponse(
  balance: SignatureCreditBalance,
): SignatureCreditBalanceResponse {
  return {
    storeId: balance.storeId,
    balance: balance.balance,
    createdAt: balance.createdAt.toISOString(),
    updatedAt: balance.updatedAt.toISOString(),
  };
}

export function toSignaturePackageRequestResponse(
  request: SignaturePackageRequest,
): SignaturePackageRequestResponse {
  return {
    id: request.id,
    storeId: request.storeId,
    packageId: request.packageId,
    quantity: request.quantity,
    priceCents: request.priceCents,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    liberatedAt: request.liberatedAt?.toISOString() ?? null,
  };
}
