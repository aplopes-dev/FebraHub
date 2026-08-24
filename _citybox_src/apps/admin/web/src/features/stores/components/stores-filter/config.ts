import type { FilterGroupDef } from "@citybox/ui/organisms";

export const STORES_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: "checkbox",
    key: "vertical",
    title: "Vertical",
    pillPrefix: "Vertical",
    column: "left",
    options: [
      { value: "Comércio", label: "Comércio" },
      { value: "Clínica", label: "Clínica" },
      { value: "Imóveis", label: "Imóveis" },
      { value: "Beautiful", label: "Beautiful" },
    ],
  },
  {
    type: "checkbox",
    key: "status",
    title: "Status da Loja",
    pillPrefix: "Status",
    column: "left",
    options: [
      { value: "IN_SETUP", label: "Em Setup" },
      { value: "TRAINING", label: "Em Treinamento" },
      { value: "PRODUCTION", label: "Produção" },
      { value: "BLOCKED", label: "Bloqueada" },
      { value: "OFFLINE", label: "Offline" },
    ],
  },
  {
    type: "date-preset",
    key: "date",
    title: "Período de Cadastro",
    pillPrefix: "Período",
    datePickerPillPrefix: "Data",
    datePickerTriggerValue: "data-especifica",
    column: "right",
    options: [
      { value: "hoje", label: "Hoje" },
      { value: "esta-semana", label: "Esta semana" },
      { value: "este-mes", label: "Este mês" },
      { value: "data-especifica", label: "Data específica" },
    ],
  },
];
