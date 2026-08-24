export type CardContractGrouping =
  | "by_card_brand"
  | "by_payment_method"
  | "no_grouping";

export type FirstPaymentDayType = "business_days" | "calendar_days";
export type InstallmentDayType =
  | "business_days"
  | "calendar_days"
  | "single_payment";
export type CutoffPeriod = "daily" | "weekly" | "monthly";

export type PaymentMethodType = "pix" | "debit" | "credit";

export type CardContractListTab = "active" | "deleted";

export type CardContractTabCounts = {
  active: number;
  deleted: number;
};

export type ProgressiveRateTier = {
  id: string;
  minInstallments: number;
  maxInstallments: number;
  rate: number;
};

/** Domínio da UI: `fee` em reais (CurrencyInput). */
export type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  brand?: string | null;
  rate?: number | null;
  fee?: number | null;
  settlementDays?: number | null;
  minInstallments?: number | null;
  maxInstallments?: number | null;
  firstPaymentDays?: number | null;
  daysBetweenInstallments?: number | null;
  progressiveEnabled: boolean;
  progressiveTiers: ProgressiveRateTier[];
};

export type CardContract = {
  id: string;
  provider: string;
  bankAccountId: string | null;
  description: string;
  paymentMethodCount: number;
  grouping: CardContractGrouping;
  cutoffPeriod: CutoffPeriod;
  firstPaymentDayType: FirstPaymentDayType;
  installmentDayType: InstallmentDayType;
  businessDaysOnly: boolean;
  /** Centavos — converter para reais na UI com CurrencyInput. */
  depositFeeCents: number;
  anticipationPeriods: number;
  anticipationRate: number;
  allEntriesPaidInContract: boolean;
  businessDaysDeposit: boolean;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Formulário trabalha `depositFee` em reais. */
export type CardContractFormValues = {
  provider: string;
  bankAccountId: string;
  description: string;
  grouping: CardContractGrouping;
  cutoffPeriod: CutoffPeriod;
  firstPaymentDayType: FirstPaymentDayType;
  installmentDayType: InstallmentDayType;
  businessDaysOnly: boolean;
  depositFee: number;
  anticipationPeriods: number;
  anticipationRate: number;
  allEntriesPaidInContract: boolean;
  businessDaysDeposit: boolean;
  active: boolean;
};

export type CardContractListParams = {
  tab: CardContractListTab;
  search: string;
  page: number;
  perPage: number;
};

export type CardContractListResult = {
  data: CardContract[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  tabCounts: CardContractTabCounts;
};

export const GROUPING_LABELS: Record<CardContractGrouping, string> = {
  by_card_brand: "Por bandeira de cartão",
  by_payment_method: "Por método de pagamento",
  no_grouping: "Sem agrupamento",
};

export const GROUPING_FILTER_LABELS: Record<
  CardContractGrouping | "all",
  string
> = {
  all: "Todos os agrupamentos",
  by_card_brand: "Por bandeira de cartão",
  by_payment_method: "Por método de pagamento",
  no_grouping: "Sem agrupamento",
};

export const GROUPING_DESCRIPTIONS: Record<CardContractGrouping, string> = {
  by_card_brand:
    "As vendas são agrupadas por bandeira do cartão utilizado",
  by_payment_method:
    "As vendas são agrupadas pelo método de pagamento (débito, crédito, etc.)",
  no_grouping:
    "Cada transação é processada individualmente sem agrupamento",
};

export const CUTOFF_PERIOD_LABELS: Record<CutoffPeriod, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

export const FIRST_PAYMENT_DAY_LABELS: Record<FirstPaymentDayType, string> = {
  business_days: "Dias úteis",
  calendar_days: "Dias corridos",
};

export const INSTALLMENT_DAY_LABELS: Record<InstallmentDayType, string> = {
  business_days: "Dias úteis",
  calendar_days: "Dias corridos",
  single_payment: "Pagamento único",
};

export const CARD_CONTRACT_TAB_LABELS: Record<CardContractListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

export const CARD_CONTRACT_TAB_ORDER: CardContractListTab[] = [
  "active",
  "deleted",
];
