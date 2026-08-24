import type { SelectOption } from "@/features/clinic/marketing/campaigns/_ui/fields";
import type { Question, FieldType } from "./page-template-step-three.schema";

// Opções de tipos de campo
export const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: "text", label: "Texto curto" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "radio", label: "Seleção (radio)" },
  { value: "checkbox", label: "Seleção múltipla (checkbox)" },
  { value: "textarea", label: "Texto longo" },
];

// Perguntas padrão (Nome e Telefone) - não removíveis
export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "field-name",
    type: "text",
    label: "Nome",
    required: true,
    helpText: "Preencha o nome completo",
  },
  {
    id: "field-phone",
    type: "phone",
    label: "Telefone",
    required: true,
    helpText: "Preencha o telefone",
  },
];

// Texto padrão do consentimento LGPD
export const DEFAULT_LGPD_CONSENT_TEXT =
  "Li e concordo com o tratamento dos meus dados conforme a política de privacidade.";

// Configurações padrão por tipo de campo
export const FIELD_TYPE_DEFAULTS: Record<
  FieldType,
  Partial<Question>
> = {
  text: {},
  phone: {},
  email: {},
  radio: {
    options: [
      { id: "opt-1", label: "Opção 1" },
      { id: "opt-2", label: "Opção 2" },
    ],
  },
  checkbox: {
    options: [
      { id: "opt-1", label: "Opção 1" },
      { id: "opt-2", label: "Opção 2" },
    ],
  },
  textarea: {},
};
