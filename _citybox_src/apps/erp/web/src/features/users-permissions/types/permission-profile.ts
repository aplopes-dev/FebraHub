/** Aba de permissões: telas do backoffice (ERP) ou do ponto de venda (PDV). */
export type PermissionScope = "erp" | "pdv";

export type PermissionItem = {
  id: string;
  label: string;
};

/** Bloco de uma entidade dentro de um grupo (ex.: "Fornecedores" dentro de "Estoque"). */
export type PermissionSubgroup = {
  id: string;
  label: string;
  items: PermissionItem[];
};

/** Grupo de nível superior na árvore de permissões (ex.: "Estoque", "Vendas"). */
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
