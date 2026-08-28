/** Aba de permissões: módulos do backoffice. */
export type PermissionScope = "backoffice";

export type PermissionItem = {
  id: string;
  label: string;
};

/** Bloco de uma entidade dentro de um grupo (ex.: "Turmas" dentro de "Acadêmico"). */
export type PermissionSubgroup = {
  id: string;
  label: string;
  items: PermissionItem[];
};

/** Grupo de nível superior na árvore de permissões (ex.: "Comercial", "Acadêmico"). */
export type PermissionGroup = {
  id: string;
  label: string;
  scope: PermissionScope;
  subgroups: PermissionSubgroup[];
};

export type PermissionCatalog = {
  groups: PermissionGroup[];
  allIds: string[];
};

export type PermissionProfile = {
  id: string;
  name: string;
  description: string;
  /** Perfis de sistema (ex.: Administrador) não podem ser editados nem excluídos. */
  isSystem: boolean;
  systemKey: string | null;
  /** Ids de {@link PermissionItem} concedidos a este perfil. */
  permissionIds: string[];
  /** Membros ativos usando este perfil. */
  activeMemberCount: number;
  deletedAt: string | null;
};

export type PermissionProfileFormValues = {
  name: string;
  description: string;
  permissionIds: string[];
};

export function createEmptyPermissionProfileFormValues(): PermissionProfileFormValues {
  return { name: "", description: "", permissionIds: [] };
}

export function permissionProfileToFormValues(
  profile: PermissionProfile,
): PermissionProfileFormValues {
  return {
    name: profile.name,
    description: profile.description,
    permissionIds: [...profile.permissionIds],
  };
}

export type PermissionProfileListTab = "active" | "deleted";

export type PermissionProfileTabCounts = {
  active: number;
  deleted: number;
};

export type PermissionProfileListParams = {
  tab: PermissionProfileListTab;
  search: string;
  page: number;
  perPage: number;
};

export type PermissionProfileListMeta = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type PermissionProfileListResult = {
  data: PermissionProfile[];
  meta: PermissionProfileListMeta;
  tabCounts: PermissionProfileTabCounts;
};

/** Opção enxuta para selects/autocompletes de perfil (ex.: form de usuário). */
export type PermissionProfileOption = {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  systemKey?: string | null;
};

export function toPermissionProfileOption(
  profile: PermissionProfile,
): PermissionProfileOption {
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    isSystem: profile.isSystem,
    systemKey: profile.systemKey,
  };
}
