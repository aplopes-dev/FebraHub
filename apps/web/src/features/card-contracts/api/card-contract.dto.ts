/**
 * Shapes do contrato da API do backend (`/v1/card-contracts`).
 * PUT é destrutivo: campo omitido volta ao default — sempre enviar o corpo
 * completo. `depositFeeCents`/`feeCents` são centavos; `rate`/`anticipationRate`
 * são percentuais 0–100.
 */

export type CardContractGroupingDto =
  | "by_card_brand"
  | "by_payment_method"
  | "no_grouping";

export type CardCutoffPeriodDto = "daily" | "weekly" | "monthly";
export type CardDayTypeDto = "business_days" | "calendar_days";
export type CardInstallmentDayTypeDto =
  | "business_days"
  | "calendar_days"
  | "single_payment";
export type CardPaymentMethodTypeDto = "pix" | "debit" | "credit";

export type CardContractDto = {
  id: string;
  provider: string;
  bankAccountId: string | null;
  description: string;
  grouping: CardContractGroupingDto;
  cutoffPeriod: CardCutoffPeriodDto;
  firstPaymentDayType: CardDayTypeDto;
  installmentDayType: CardInstallmentDayTypeDto;
  businessDaysOnly: boolean;
  depositFeeCents: number;
  anticipationPeriods: number;
  anticipationRate: number;
  allEntriesPaidInContract: boolean;
  businessDaysDeposit: boolean;
  active: boolean;
  paymentMethodCount: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardContractListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type CardContractTabCountsDto = {
  active: number;
  deleted: number;
};

export type CardContractListResponseDto = {
  data: CardContractDto[];
  meta: CardContractListMetaDto;
  tabCounts: CardContractTabCountsDto;
};

export type CardContractResponseDto = {
  data: CardContractDto;
};

export type SaveCardContractPayload = {
  provider: string;
  bankAccountId?: string | null;
  description?: string;
  grouping?: CardContractGroupingDto;
  cutoffPeriod?: CardCutoffPeriodDto;
  firstPaymentDayType?: CardDayTypeDto;
  installmentDayType?: CardInstallmentDayTypeDto;
  businessDaysOnly?: boolean;
  depositFeeCents?: number;
  anticipationPeriods?: number;
  anticipationRate?: number;
  allEntriesPaidInContract?: boolean;
  businessDaysDeposit?: boolean;
  active?: boolean;
};

export type CardRateTierDto = {
  id: string;
  minInstallments: number;
  maxInstallments: number;
  rate: number;
};

export type CardPaymentMethodDto = {
  id: string;
  type: CardPaymentMethodTypeDto;
  brand: string | null;
  rate: number | null;
  feeCents: number | null;
  settlementDays: number | null;
  minInstallments: number | null;
  maxInstallments: number | null;
  firstPaymentDays: number | null;
  daysBetweenInstallments: number | null;
  progressiveEnabled: boolean;
  progressiveTiers: CardRateTierDto[];
};

export type CardPaymentMethodListResponseDto = {
  data: CardPaymentMethodDto[];
};

export type CardPaymentMethodResponseDto = {
  data: CardPaymentMethodDto;
};

export type SaveCardRateTierPayload = {
  id?: string;
  minInstallments: number;
  maxInstallments: number;
  rate: number;
};

export type SaveCardPaymentMethodPayload = {
  type: CardPaymentMethodTypeDto;
  brand?: string | null;
  rate?: number | null;
  feeCents?: number | null;
  settlementDays?: number | null;
  minInstallments?: number | null;
  maxInstallments?: number | null;
  firstPaymentDays?: number | null;
  daysBetweenInstallments?: number | null;
  progressiveEnabled?: boolean;
  progressiveTiers?: SaveCardRateTierPayload[];
};
