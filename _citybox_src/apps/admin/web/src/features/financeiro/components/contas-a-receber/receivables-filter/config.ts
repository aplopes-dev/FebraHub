import type { FilterGroupDef } from "@citybox/ui/organisms";

export const RECEIVABLES_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: "checkbox",
    key: "status",
    title: "Status",
    pillPrefix: "Status",
    column: "left",
    options: [
      { value: "OPEN", label: "Pendente" },
      { value: "PAID", label: "Paga" },
      { value: "PAST_DUE", label: "Vencida" },
    ],
  },
  {
    type: "checkbox",
    key: "method",
    title: "Método de Pagamento",
    pillPrefix: "Método",
    column: "left",
    options: [
      { value: "PIX", label: "Pix" },
      { value: "CREDIT_CARD", label: "Cartão" },
      { value: "BOLETO", label: "Boleto" },
    ],
  },
  {
    type: "date-preset",
    key: "dueDate",
    title: "Vencimento",
    pillPrefix: "Vencimento",
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
