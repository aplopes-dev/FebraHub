import { describe, expect, it } from "vitest";

import { aggregateByPaymentMethod } from "./aggregate-by-payment-method";
import type { FinancialEntry } from "../types";

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
    status: partial.status ?? "received",
    origin: "manual",
    description: partial.description ?? "x",
    value: partial.value,
    dueDate: partial.dueDate ?? "2026-07-01",
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
    account: null,
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

describe("aggregateByPaymentMethod", () => {
  it("soma receitas e despesas por meio e calcula saldo", () => {
    const rows = aggregateByPaymentMethod([
      entry({ id: "1", type: "income", value: 11500, paymentMethod: "cash", status: "received" }),
      entry({ id: "2", type: "expense", value: 2500, paymentMethod: "cash", status: "paid" }),
      entry({ id: "3", type: "income", value: 300, paymentMethod: "pix", status: "received" }),
    ]);

    expect(rows).toEqual([
      { method: "cash", income: 11500, expense: 2500, balance: 9000 },
      { method: "pix", income: 300, expense: 0, balance: 300 },
    ]);
  });

  it("ignora cancelados e entradas sem meio de pagamento", () => {
    const rows = aggregateByPaymentMethod([
      entry({ id: "1", type: "income", value: 100, paymentMethod: "boleto", status: "received" }),
      entry({ id: "2", type: "income", value: 50, paymentMethod: null, status: "pending" }),
      entry({
        id: "3",
        type: "expense",
        value: 20,
        paymentMethod: "boleto",
        status: "cancelled",
      }),
    ]);

    expect(rows).toEqual([
      { method: "boleto", income: 100, expense: 0, balance: 100 },
    ]);
  });

  it("omite meios com totais zerados", () => {
    expect(aggregateByPaymentMethod([])).toEqual([]);
  });
});
