export interface CreateSubscriptionDto {
  /** Unidade de billing — obrigatória desde a Fase 10 (não há mais Cliente). */
  storeId: string;
  planPriceId: string;
  cycle: string;
  dayOfMonth: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface UpdateSubscriptionDto {
  id: string;
  cycle?: string;
  dayOfMonth?: number;
}

export interface FindSubscriptionByIdDto {
  id: string;
}

export interface CancelSubscriptionDto {
  id: string;
}

export interface ListSubscriptionsDto {
  page?: number;
  perPage?: number;
  /** Filtro por loja — substituiu o filtro por cliente na Fase 10. */
  storeId?: string;
  planPriceId?: string;
  status?: string[];
}
