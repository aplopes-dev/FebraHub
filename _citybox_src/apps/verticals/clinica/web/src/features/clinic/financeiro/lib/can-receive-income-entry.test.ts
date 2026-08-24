import { describe, expect, it } from "vitest";

import {
  canReceiveIncomeEntry,
  dueDateRelation,
} from "./can-receive-income-entry";

describe("dueDateRelation", () => {
  it("classifica futuro, hoje e passado", () => {
    expect(dueDateRelation("2026-08-10", "2026-08-04")).toBe("future");
    expect(dueDateRelation("2026-08-04", "2026-08-04")).toBe("today");
    expect(dueDateRelation("2026-08-01", "2026-08-04")).toBe("past");
  });
});

describe("canReceiveIncomeEntry", () => {
  const today = "2026-08-04";

  it("settle sozinho só libera vencimento = hoje", () => {
    const flags = {
      canSettleIncome: true,
      canSettleFuture: false,
      canSettleRetroactive: false,
    };
    expect(canReceiveIncomeEntry(flags, "2026-09-01", today)).toBe(false);
    expect(canReceiveIncomeEntry(flags, "2026-08-04", today)).toBe(true);
    expect(canReceiveIncomeEntry(flags, "2026-07-01", today)).toBe(false);
  });

  it("settleFuture libera só parcelas futuras", () => {
    const flags = {
      canSettleIncome: false,
      canSettleFuture: true,
      canSettleRetroactive: false,
    };
    expect(canReceiveIncomeEntry(flags, "2026-09-01", today)).toBe(true);
    expect(canReceiveIncomeEntry(flags, "2026-08-04", today)).toBe(false);
    expect(canReceiveIncomeEntry(flags, "2026-07-01", today)).toBe(false);
  });

  it("settleRetroactive libera só vencidas", () => {
    const flags = {
      canSettleIncome: false,
      canSettleFuture: false,
      canSettleRetroactive: true,
    };
    expect(canReceiveIncomeEntry(flags, "2026-07-01", today)).toBe(true);
    expect(canReceiveIncomeEntry(flags, "2026-08-04", today)).toBe(false);
    expect(canReceiveIncomeEntry(flags, "2026-09-01", today)).toBe(false);
  });

  it("settle + future + retroactive liberam todos os casos", () => {
    const flags = {
      canSettleIncome: true,
      canSettleFuture: true,
      canSettleRetroactive: true,
    };
    expect(canReceiveIncomeEntry(flags, "2026-09-01", today)).toBe(true);
    expect(canReceiveIncomeEntry(flags, "2026-08-04", today)).toBe(true);
    expect(canReceiveIncomeEntry(flags, "2026-07-01", today)).toBe(true);
  });
});
