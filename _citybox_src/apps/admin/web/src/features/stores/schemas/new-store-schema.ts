import { z } from "zod";
import { CLINIC_STRANDS } from "@citybox/messaging/clinic-strand";
import { isValidCnpj, isValidCpf } from "@/lib/validate-brazilian-document";

const addressFields = {
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  telefone: z.string().optional(),
};

export const newStoreSchema = z
  .object({
    // "create" exige plano + dados fiscais completos (POST /v1/stores); "edit" reaproveita os
    // mesmos steps de fiscal/localização mas sem plano/vertical (PUT /v1/stores/:id)
    mode: z.enum(["create", "edit"]),

    // Identidade
    vertical: z.enum(["Comércio", "Clínica", "Imóveis", "Beautiful"], {
      error: "Selecione a vertical de negócio",
    }),
    clinicStrand: z.enum(CLINIC_STRANDS).optional(),
    tradeName: z.string().min(1, "Nome Fantasia é obrigatório"),
    slug: z
      .string()
      .min(1, "Slug é obrigatório")
      .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),

    // Plano — somente na criação (FR-001/FR-015)
    planId: z.string().optional(),
    billingCycle: z.union([z.enum(["MONTHLY", "YEARLY"]), z.literal("")]).optional(),
    dueDay: z.string().optional(),

    // Dados Fiscais — a loja carrega seus próprios dados (FR-001), sem "Cliente" proprietário
    personType: z.union([z.enum(["PF", "PJ"]), z.literal("")]).optional(),
    document: z.string().optional(),
    legalName: z.string().optional(),
    stateRegistration: z.string().optional(),
    responsibleName: z.string().optional(),
    billingEmail: z.string().optional(),

    // Localização e Operação
    ...addressFields,
    timezone: z.string().min(1, "Selecione o fuso horário"),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "create") return;

    if (!data.planId) {
      ctx.addIssue({ code: "custom", path: ["planId"], message: "Selecione um plano" });
    }
    if (!data.billingCycle) {
      ctx.addIssue({
        code: "custom",
        path: ["billingCycle"],
        message: "Selecione o ciclo de faturamento",
      });
    }
    if (!data.dueDay) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDay"],
        message: "Selecione o dia de vencimento",
      });
    }

    if (data.personType !== "PF" && data.personType !== "PJ") {
      ctx.addIssue({
        code: "custom",
        path: ["personType"],
        message: "Selecione o tipo de pessoa",
      });
    } else {
      const isCpf = data.personType === "PF";
      if (!data.document?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["document"],
          message: isCpf ? "CPF é obrigatório" : "CNPJ é obrigatório",
        });
      } else if (isCpf ? !isValidCpf(data.document) : !isValidCnpj(data.document)) {
        ctx.addIssue({
          code: "custom",
          path: ["document"],
          message: isCpf ? "CPF inválido" : "CNPJ inválido",
        });
      }
    }

    if (data.personType === "PJ" && !data.legalName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["legalName"],
        message: "Razão social é obrigatória",
      });
    }

    if (!data.responsibleName?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["responsibleName"],
        message: "Nome do responsável é obrigatório",
      });
    }

    if (!data.billingEmail?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["billingEmail"],
        message: "E-mail de cobrança é obrigatório",
      });
    } else if (!z.string().email().safeParse(data.billingEmail).success) {
      ctx.addIssue({ code: "custom", path: ["billingEmail"], message: "E-mail inválido" });
    }

    if (data.vertical === "Clínica" && !data.clinicStrand) {
      ctx.addIssue({
        code: "custom",
        path: ["clinicStrand"],
        message: "Selecione a vertente da clínica",
      });
    }
  });

export type NewStoreFormData = z.infer<typeof newStoreSchema>;

export const NEW_STORE_DEFAULT_VALUES: NewStoreFormData = {
  mode: "create",
  vertical: "Comércio",
  clinicStrand: undefined,
  tradeName: "",
  slug: "",
  planId: "",
  billingCycle: "",
  dueDay: "",
  personType: "",
  document: "",
  legalName: "",
  stateRegistration: "",
  responsibleName: "",
  billingEmail: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  telefone: "",
  timezone: "America/Sao_Paulo",
};

export const EDIT_STORE_DEFAULT_VALUES: NewStoreFormData = {
  ...NEW_STORE_DEFAULT_VALUES,
  mode: "edit",
};
