import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Settings,
  Wallet,
} from "lucide-react";
import type { AdminPermissionKey } from "../types";

export interface PermissionOption {
  key: AdminPermissionKey;
  label: string;
  description: string;
}

export interface PermissionModule {
  id: string;
  label: string;
  icon: LucideIcon;
  permissions: PermissionOption[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "clientes",
    label: "Clientes & Lojas",
    icon: BriefcaseBusiness,
    permissions: [
      {
        key: "clientes.read",
        label: "Leitura",
        description:
          "Pode apenas ver a lista e detalhes de clientes/lojas.",
      },
      {
        key: "clientes.write",
        label: "Criação/Edição",
        description:
          "Pode cadastrar novas lojas e editar dados cadastrais.",
      },
      {
        key: "clientes.critical",
        label: "Ações Críticas",
        description:
          "Pode bloquear lojas, transferir titularidade e usar impersonation.",
      },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: Wallet,
    permissions: [
      {
        key: "financeiro.read",
        label: "Leitura Financeira",
        description:
          "Pode ver o dashboard financeiro e status de faturas.",
      },
      {
        key: "financeiro.billing",
        label: "Gestão de Cobranças",
        description:
          "Pode estornar faturas, dar baixa manual e gerar links de pagamento.",
      },
      {
        key: "financeiro.contracts",
        label: "Gestão de Contratos",
        description: "Pode alterar planos e dar descontos.",
      },
    ],
  },
  {
    id: "config",
    label: "Configurações & Infraestrutura",
    icon: Settings,
    permissions: [
      {
        key: "config.logs",
        label: "Logs & Auditoria",
        description:
          "Acesso total ao histórico de ações e logs de sistema.",
      },
      {
        key: "config.users",
        label: "Controle de Usuários (Admin)",
        description:
          "Pode convidar novos funcionários e alterar permissões.",
      },
    ],
  },
];

export const ALL_PERMISSION_KEYS: AdminPermissionKey[] = PERMISSION_MODULES.flatMap(
  (module) => module.permissions.map((permission) => permission.key),
);

export function selectAllPermissions(): AdminPermissionKey[] {
  return [...ALL_PERMISSION_KEYS];
}
