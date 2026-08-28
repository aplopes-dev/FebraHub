import type { MembershipRole } from "@/features/users-permissions/types/user";

export type PlatformRoleOption = {
  value: MembershipRole;
  label: string;
  description: string;
};

/**
 * Papéis atribuíveis pela tela — `admin`, `gestor` e `membro` do `apps/api`
 * (`PAPEIS` em `modules/permissoes/permissoes.dto.ts`).
 *
 * `OWNER` fica fora: é o dono da conta, criado no seed, e não se concede a
 * ninguém pelo cadastro. Quando a pessoa editada já é OWNER, a tela acrescenta
 * a opção só para exibir o valor atual (ver `PLATFORM_ROLE_OWNER`).
 */
export const PLATFORM_ROLE_OPTIONS: PlatformRoleOption[] = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Atravessa o catálogo inteiro: vê e faz tudo, em todo setor.",
  },
  {
    value: "MANAGER",
    label: "Gestor",
    description: "Responde pelo próprio setor — define metas e indicadores dele.",
  },
  {
    value: "MEMBER",
    label: "Membro",
    description: "Faz o que o perfil de acesso liberar, dentro dos setores dele.",
  },
];

export const PLATFORM_ROLE_OWNER: PlatformRoleOption = {
  value: "OWNER",
  label: "Proprietário",
  description: "Dono da conta. Não pode ser atribuído nem removido por aqui.",
};

export function platformRoleLabel(role: MembershipRole): string {
  if (role === "OWNER") return PLATFORM_ROLE_OWNER.label;
  return (
    PLATFORM_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
  );
}
