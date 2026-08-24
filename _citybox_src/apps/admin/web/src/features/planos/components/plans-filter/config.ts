import type { FilterGroupDef } from "@citybox/ui/organisms";

export const PLANS_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: "checkbox",
    key: "status",
    title: "Status",
    pillPrefix: "Status",
    column: "left",
    options: [
      { value: "ACTIVE", label: "Ativo" },
      { value: "HIDDEN", label: "Oculto" },
    ],
  },
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
];
