/**
 * Shapes do contrato da `erp-api` (`/v1/payment-methods`).
 * O domínio do front (`types/payment-method.ts`) já espelha o DTO quase 1:1 —
 * o mapper só descarta `createdAt`/`updatedAt` (não usados na UI) e garante
 * imutabilidade.
 */

export type PaymentMethodDto = {
  id: string;
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
  isSystem: boolean;
  systemKey: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethodListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PaymentMethodTabCountsDto = {
  active: number;
  deleted: number;
};

export type PaymentMethodListResponseDto = {
  data: PaymentMethodDto[];
  meta: PaymentMethodListMetaDto;
  tabCounts: PaymentMethodTabCountsDto;
};

export type PaymentMethodResponseDto = {
  data: PaymentMethodDto;
};

export type SavePaymentMethodPayload = {
  name: string;
  fiscalCode: string | null;
  installmentPermission: string | null;
};
