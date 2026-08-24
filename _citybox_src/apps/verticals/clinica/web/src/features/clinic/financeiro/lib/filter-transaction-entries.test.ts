import { describe, expect, it } from "vitest";

import { filterTransactionEntries } from "./filter-transaction-entries";
import type { FinancialEntry, TransactionsFilters } from "../types";

function entry(
  partial: Partial<FinancialEntry> & {
    id: string;
    type: FinancialEntry["type"];
    value: number;
  },
): FinancialEntry {
  return {
    id: partial.id,
    type: partial.type,
    status: partial.status ?? "pending",
    origin: "manual",
    description: partial.description ?? "x",
    value: partial.value,
    dueDate: partial.dueDate ?? "2026-07-10",
    paidAt: partial.paidAt ?? null,
    paidValue: partial.paidValue ?? null,
    paymentMethod: partial.paymentMethod ?? null,
    paymentType: null,
    observation: null,
    hasReceipt: false,
    receiptUrl: null,
    isOverdue: false,
    installmentNumber: null,
    totalInstallments: null,
    recurrenceGroupId: null,
    categoryId: null,
    category: null,
    incomeCategoryId: null,
    incomeCategory: null,
    account: partial.account ?? null,
    patientId: null,
    patient: null,
    budgetId: null,
    checkDate: null,
    checkName: null,
    checkNumber: null,
    checkBank: null,
    checkCpfCnpj: null,
    createdAt: "2026-06-01",
  };
}

const ALL: TransactionsFilters = {
  types: [],
  statuses: [],
  cashRegisters: [],
  paymentMethods: [],
};

describe("filterTransactionEntries", () => {
  const sample: FinancialEntry[] = [
    entry({
      id: "a",
      type: "income",
      value: 100,
      dueDate: "2026-07-05",
      status: "received",
      paidAt: "2026-07-05",
      paymentMethod: "cash",
      account: { id: "acc-1", name: "Caixa" },
    }),
    entry({
      id: "b",
      type: "expense",
      value: 40,
      dueDate: "2026-07-08",
      status: "paid",
      paidAt: "2026-07-08",
      paymentMethod: "boleto",
      account: { id: "acc-2", name: "Itaú" },
    }),
    entry({
      id: "c",
      type: "income",
      value: 50,
      dueDate: "2026-07-20",
      status: "pending",
      paymentMethod: "cash",
    }),
    entry({
      id: "d",
      type: "expense",
      value: 10,
      dueDate: "2026-07-12",
      status: "pending",
    }),
    entry({
      id: "e",
      type: "income",
      value: 5,
      dueDate: "2026-06-01",
      status: "received",
      paidAt: "2026-06-01",
      paymentMethod: "pix",
    }),
    entry({
      id: "f",
      type: "expense",
      value: 20,
      dueDate: "2026-07-10",
      status: "paid",
      paidAt: "2026-08-01",
      paymentMethod: "pix",
      account: { id: "acc-1", name: "Caixa" },
    }),
  ];

  it("exclui pendentes — só paid/received (já processados no fluxo de caixa)", () => {
    const result = filterTransactionEntries({
      entries: sample,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      filters: ALL,
      today: "2026-07-14",
    });
    expect(result.map((e) => e.id).sort()).toEqual(["a", "b", "e", "f"]);
  });

  it("filtra por período (ainda só liquidados)", () => {
    const result = filterTransactionEntries({
      entries: sample,
      startDate: "2026-07-01",
      endDate: "2026-07-15",
      filters: ALL,
      today: "2026-07-14",
    });
    expect(result.map((e) => e.id).sort()).toEqual(["a", "b", "f"]);
  });

  it("filtra por tipo e meio de pagamento", () => {
    const result = filterTransactionEntries({
      entries: sample,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      filters: { ...ALL, types: ["income"], paymentMethods: ["cash"] },
      today: "2026-07-14",
    });
    expect(result.map((e) => e.id).sort()).toEqual(["a"]);
  });

  it("filtra pagas / agendadas (apenas entre liquidados)", () => {
    const paid = filterTransactionEntries({
      entries: sample,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      filters: { ...ALL, statuses: ["paid"] },
      today: "2026-07-14",
    });
    expect(paid.map((e) => e.id).sort()).toEqual(["a", "b", "e", "f"]);

    const scheduled = filterTransactionEntries({
      entries: sample,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      filters: { ...ALL, statuses: ["scheduled"] },
      today: "2026-07-14",
    });
    expect(scheduled.map((e) => e.id)).toEqual(["f"]);
  });

  it("filtra por conta (caixa)", () => {
    const result = filterTransactionEntries({
      entries: sample,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      filters: { ...ALL, cashRegisters: ["acc-2"] },
      today: "2026-07-14",
    });
    expect(result.map((e) => e.id)).toEqual(["b"]);
  });
});
