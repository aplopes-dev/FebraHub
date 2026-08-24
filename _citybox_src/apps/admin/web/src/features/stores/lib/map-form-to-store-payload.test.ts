import { describe, expect, it } from "vitest";
import { newStoreSchema, type NewStoreFormData } from "../schemas/new-store-schema";
import {
  mapFormToCreateStorePayload,
  mapFormToUpdateStorePayload,
} from "./map-form-to-store-payload";

function baseForm(overrides: Partial<NewStoreFormData> = {}): NewStoreFormData {
  return {
    mode: "create",
    vertical: "Comércio",
    tradeName: "Loja Teste",
    slug: "loja-teste",
    planId: "plan-1",
    billingCycle: "MONTHLY",
    dueDay: "10",
    personType: "PJ",
    document: "11.222.333/0001-81",
    legalName: "Loja Teste Ltda",
    stateRegistration: "",
    responsibleName: "Ana Silva",
    billingEmail: "ana@loja.test",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    telefone: "",
    timezone: "America/Bahia",
    ...overrides,
  };
}

describe("newStoreSchema — legalName", () => {
  it("rejeita PJ sem razão social", () => {
    const result = newStoreSchema.safeParse(baseForm({ legalName: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path.includes("legalName")),
      ).toBe(true);
    }
  });

  it("aceita PF sem legalName", () => {
    const result = newStoreSchema.safeParse(
      baseForm({
        personType: "PF",
        document: "529.982.247-25",
        legalName: "",
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("mapFormToCreateStorePayload — legalName PF", () => {
  it("usa tradeName como legalName quando PF omite razão social", () => {
    const payload = mapFormToCreateStorePayload(
      baseForm({
        personType: "PF",
        document: "529.982.247-25",
        legalName: "",
        tradeName: "Ana MEI",
      }),
    );
    expect(payload.legalName).toBe("Ana MEI");
  });

  it("mantém legalName preenchida em PJ", () => {
    const payload = mapFormToCreateStorePayload(baseForm());
    expect(payload.legalName).toBe("Loja Teste Ltda");
  });
});

describe("mapFormToUpdateStorePayload — legalName PF", () => {
  it("usa tradeName como legalName quando PF omite razão social", () => {
    const payload = mapFormToUpdateStorePayload(
      baseForm({
        personType: "PF",
        document: "529.982.247-25",
        legalName: "",
        tradeName: "Ana MEI",
      }),
    );
    expect(payload.legalName).toBe("Ana MEI");
  });
});
