import type { FilterGroupDef } from "@citybox/ui/organisms";

export const SUBSCRIPTIONS_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: "checkbox",
    key: "status",
    title: "Status do Contrato",
    pillPrefix: "Status",
    column: "left",
    options: [
      { value: "ativo", label: "Ativo" },
      { value: "atrasado", label: "Atrasado" },
      { value: "cancelado", label: "Cancelado" },
    ],
  },
  {
    type: "checkbox",
    key: "plan",
    title: "Plano",
    pillPrefix: "Plano",
    column: "left",
    options: [
      { value: "starter", label: "Starter" },
      { value: "pro", label: "Pro" },
    ],
  },
];
