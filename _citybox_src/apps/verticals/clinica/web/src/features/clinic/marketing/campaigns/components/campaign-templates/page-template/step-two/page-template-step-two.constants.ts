import type { SelectOption } from "@/features/clinic/marketing/campaigns/_ui/fields";

export const TREATMENT_FOCUS_OPTIONS: SelectOption[] = [
  { value: "implantes", label: "Implantes" },
  { value: "ortodontia", label: "Ortodontia" },
  { value: "estetica", label: "Estética" },
  { value: "geral", label: "Geral" },
];

export const OWNER_OPTIONS: SelectOption[] = [
  { value: "none", label: "Sem responsável" },
  { value: "dra-ana", label: "Dra. Ana" },
  { value: "recepcao", label: "Recepção" },
  { value: "rotativo", label: "Rotativo" },
];

export const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "system", label: "Sistema" },
] as const;

export const DUPLICITY_RULE_OPTIONS = [
  { value: "block", label: "Bloquear duplicados" },
  { value: "update", label: "Atualizar existente" },
  { value: "create_new", label: "Criar novo sempre" },
] as const;

export const SUCCESS_ACTION_OPTIONS = [
  { value: "message", label: "Mostrar Mensagem" },
  { value: "redirect", label: "Redirecionar" },
] as const;
