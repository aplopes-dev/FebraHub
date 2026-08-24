import { describe, expect, it } from "vitest";

import {
  buildTransactionsApiParams,
  buildTransactionsByMethodApiParams,
  statsFromPaymentMethodSummaries,
  toPaymentMethodSummary,
} from "./build-transactions-api-params";
import { EMPTY_TRANSACTIONS_FILTERS } from "../types";

describe("buildTransactionsApiParams", () => {
  it("maps settled list with paidAt period", () => {
    const params = buildTransactionsApiParams({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      filters: {
        ...EMPTY_TRANSACTIONS_FILTERS,
        types: ["income"],
        paymentMethods: ["pix"],
      },
      page: 2,
      perPage: 20,
    });

    expect(params).toMatchObject({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      dateField: "paidAt",
      statuses: "paid,received",
      types: "income",
      paymentMethods: "pix",
      page: 2,
      perPage: 20,
    });
    expect(params.paidAtFrom).toBeUndefined();
  });

  it("adds paidAtFrom when only scheduled is selected", () => {
    const params = buildTransactionsApiParams({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      filters: {
        ...EMPTY_TRANSACTIONS_FILTERS,
        statuses: ["scheduled"],
      },
    });

    expect(params.paidAtFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("by-method + stats helpers", () => {
  it("converts cents aggregate and builds stats", () => {
    const rows = [
      toPaymentMethodSummary({
        paymentMethod: "pix",
        incomeCents: 10000,
        expenseCents: 2500,
        balanceCents: 7500,
      }),
    ];
    expect(rows[0]).toEqual({
      method: "pix",
      income: 100,
      expense: 25,
      balance: 75,
    });
    expect(statsFromPaymentMethodSummaries(rows).balance.current).toBe(75);

    const byMethod = buildTransactionsByMethodApiParams({
      startDate: "2026-07-01",
      endDate: "2026-07-31",
      filters: EMPTY_TRANSACTIONS_FILTERS,
    });
    expect(byMethod.dateField).toBe("paidAt");
  });
});
