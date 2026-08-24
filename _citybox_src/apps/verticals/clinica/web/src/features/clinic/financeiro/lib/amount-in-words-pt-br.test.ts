import { describe, expect, it } from "vitest";

import { amountInWordsPtBr } from "./amount-in-words-pt-br";

describe("amountInWordsPtBr", () => {
  it("converte valor integral em reais", () => {
    expect(amountInWordsPtBr(32250)).toBe(
      "trinta e dois mil e duzentos e cinquenta reais",
    );
  });

  it("trata um real", () => {
    expect(amountInWordsPtBr(1)).toBe("um real");
  });

  it("inclui centavos", () => {
    expect(amountInWordsPtBr(10.5)).toBe("dez reais e cinquenta centavos");
  });
});
