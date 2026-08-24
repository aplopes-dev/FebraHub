import { z } from "zod";

// Tipos de campo disponíveis
export const FIELD_TYPES = [
  "text",
  "phone",
  "email",
  "radio",
  "checkbox",
  "textarea",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

// Schema para opção de resposta (radio/checkbox)
export const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label da opção é obrigatório"),
  tag: z.string().optional(), // Tag gerada quando esta opção é selecionada
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;

// Schema para pergunta individual
export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, "Label da pergunta é obrigatório"),
  required: z.boolean(),
  helpText: z.string().optional(),
  options: z.array(questionOptionSchema).optional(), // Para radio e checkbox
});

export type Question = z.infer<typeof questionSchema>;

// Schema para consentimento LGPD
export const lgpdConsentSchema = z.object({
  text: z.string().min(1, "Texto do consentimento é obrigatório"),
  privacyPolicyUrl: z
    .string()
    .default("")
    .transform((val) => {
      if (!val || val.trim() === "") return "";
      // Se já tem protocolo, retorna como está
      if (/^https?:\/\//i.test(val)) return val;
      // Se não tem protocolo, adiciona https://
      return `https://${val}`;
    }),
});

export type LgpdConsent = z.infer<typeof lgpdConsentSchema>;

// Schema principal do Step 3
export const pageStrategyStepThreeSchema = z
  .object({
    introText: z.string().optional(), // HTML/Markdown
    questions: z.array(questionSchema).min(2, "Deve haver pelo menos 2 perguntas (Nome e Telefone)"),
    lgpdConsent: lgpdConsentSchema,
    // Identidade Visual
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (#RRGGBB)").optional().or(z.literal("")),
    logoUrl: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Validar que Nome e Telefone existem e são obrigatórios
      const hasName = data.questions.some(
        (q) => q.id === "field-name" && q.required === true
      );
      const hasPhone = data.questions.some(
        (q) => q.id === "field-phone" && q.required === true
      );
      return hasName && hasPhone;
    },
    {
      message: "Os campos Nome e Telefone são obrigatórios e não podem ser removidos",
      path: ["questions"],
    }
  )
  .refine(
    (data) => {
      // Validar que perguntas do tipo radio/checkbox têm pelo menos 2 opções
      return data.questions.every((q) => {
        if (q.type === "radio" || q.type === "checkbox") {
          return q.options && q.options.length >= 2;
        }
        return true;
      });
    },
    {
      message: "Perguntas do tipo radio ou checkbox devem ter pelo menos 2 opções",
      path: ["questions"],
    }
  );

export type PageStrategyStepThreeFormData = z.infer<
  typeof pageStrategyStepThreeSchema
>;
