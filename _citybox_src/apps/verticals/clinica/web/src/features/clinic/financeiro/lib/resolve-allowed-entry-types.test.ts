import { describe, expect, it } from "vitest";

import {
  resolveAllowedEntryTypes,
  resolveListTypesParam,
} from "./resolve-allowed-entry-types";

describe("resolveAllowedEntryTypes", () => {
  it("só despesas com visualizar despesas", () => {
    expect(
      resolveAllowedEntryTypes({
        canViewIncome: false,
        canViewExpense: true,
      }),
    ).toEqual(["expense"]);
  });

  it("só receitas com visualizar receitas", () => {
    expect(
      resolveAllowedEntryTypes({
        canViewIncome: true,
        canViewExpense: false,
      }),
    ).toEqual(["income"]);
  });

  it("ambos os tipos com as duas views", () => {
    expect(
      resolveAllowedEntryTypes({
        canViewIncome: true,
        canViewExpense: true,
      }),
    ).toEqual(["income", "expense"]);
  });

  it("sem views não libera tipos (resumo sozinho não conta)", () => {
    expect(
      resolveAllowedEntryTypes({
        canViewIncome: false,
        canViewExpense: false,
      }),
    ).toEqual([]);
  });
});

describe("resolveListTypesParam", () => {
  it("força expense quando só despesas são permitidas", () => {
    expect(resolveListTypesParam([], ["expense"])).toBe("expense");
  });

  it("não envia types quando ambos são permitidos e sem filtro", () => {
    expect(resolveListTypesParam([], ["income", "expense"])).toBeUndefined();
  });

  it("intersecta filtro com permitido", () => {
    expect(
      resolveListTypesParam(["income", "expense"], ["expense"]),
    ).toBe("expense");
  });
});
