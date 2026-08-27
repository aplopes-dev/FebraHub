/** Espelha `contracts/financial-statement-api.md` § `GET /v1/financial-entries/summary`. */
export type FinancialStatementSummaryDto = {
  receivableCents: number;
  payableCents: number;
  netCents: number;
};
