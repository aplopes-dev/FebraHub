import type { FilterGroupDef } from "@citybox/ui/organisms";

export const USUARIOS_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: "checkbox",
    key: "role",
    title: "Perfil",
    pillPrefix: "Perfil",
    column: "left",
    options: [
      { value: "platform_admin", label: "Administrador" },
      { value: "platform_operator", label: "Operador" },
    ],
  },
];
