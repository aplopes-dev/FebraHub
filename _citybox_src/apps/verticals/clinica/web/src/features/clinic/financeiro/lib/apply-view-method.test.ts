import { describe, expect, it } from "vitest";

import { applyViewMethod } from "./apply-view-method";
import { EMPTY_TRANSACTIONS_FILTERS } from "../types";

describe("applyViewMethod", () => {
  it("define viewMode transactions e filtra pelo meio", () => {
    const next = applyViewMethod(
      { ...EMPTY_TRANSACTIONS_FILTERS, types: ["income"] },
      "cash",
    );
    expect(next.viewMode).toBe("transactions");
    expect(next.filters).toEqual({
      types: ["income"],
      statuses: [],
      cashRegisters: [],
      paymentMethods: ["cash"],
    });
  });
});
