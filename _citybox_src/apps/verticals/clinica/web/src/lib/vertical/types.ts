export type VerticalNavLeaf = {
  id: string;
  label: string;
  path: string;
  /** Rotas adicionais que mantêm este leaf ativo sem criar itens extras no menu. */
  aliases?: string[];
  description?: string;
  /** Item visível no menu mas não navegável (ex.: PDV em breve). */
  disabled?: boolean;
  /** Rótulo auxiliar ao lado do label (ex.: "Em breve"). */
  badge?: string;
  /** Texto do tooltip quando disabled (ex.: funcionalidade em desenvolvimento). */
  disabledTooltip?: string;
};

export type VerticalNavModule = {
  id: string;
  label: string;
  icon?: string;
  children: VerticalNavLeaf[];
};

export type VerticalBrand = {
  name: string;
  shortName: string;
  tagline?: string;
};

export type VerticalTheme = {
  primaryColor: string;
  primaryForeground: string;
  primaryHsl: string;
  primaryForegroundHsl: string;
  /** Tom mais escuro da primária — textos de ênfase, abas ativas, etc. */
  primaryDarkHsl?: string;
  brandGradient?: 'primary';
};

/** Slots de classe para customizar o AppSidebarDual por vertical (ver @citybox/ui AppSidebarDualClassNames). */
export type VerticalSidebarClassNames = {
  provider?: string;
  iconRail?: string;
  iconRailMenuButton?: string;
  iconRailMenuButtonActive?: string;
  panel?: string;
  header?: string;
};

export type VerticalSidebarShell = {
  classNames?: VerticalSidebarClassNames;
};

export type VerticalNavDefaults = {
  defaultModuleId: string;
  defaultLeafId: string;
};

export type VerticalNavPermissionsApi = {
  filterNavModules: (modules: VerticalNavModule[], permissions: string[]) => VerticalNavModule[];
  canAccessPath: (pathname: string, modules: VerticalNavModule[], permissions: string[]) => boolean;
  canWritePath: (pathname: string, modules: VerticalNavModule[], permissions: string[]) => boolean;
  canAccessWithAnyOf: (permissions: string[], required: string[]) => boolean;
};

/** Configurações de branding da loja expostas pelo manifest (shape mínimo do shell). */
export type VerticalStoreBrandingSettings = {
  theme: string;
  brandAccent: string;
  displayName: string | null;
  hasLogo: boolean;
};

export type VerticalStorePermissionsView = {
  permissions: string[];
  canManageRoles: boolean;
};

export type VerticalManifestServices = {
  fetchStoreSettings: (storeId: string) => Promise<VerticalStoreBrandingSettings & Record<string, unknown>>;
  fetchStoreLogoBlob: (storeId: string) => Promise<string | null>;
  fetchMyStorePermissions: (storeId: string) => Promise<VerticalStorePermissionsView>;
};

export type VerticalManifest = {
  id: string;
  label: string;
  platformPermission: string;
  brand: VerticalBrand;
  theme?: VerticalTheme;
  sidebar?: VerticalSidebarShell;
  navModules: VerticalNavModule[];
  navDefaults?: VerticalNavDefaults;
  permissions: VerticalNavPermissionsApi;
  usesStoreBrandingApi: boolean;
  usesStorePermissionsApi: boolean;
  rolesAdminPathPrefix?: string;
  services?: VerticalManifestServices;
};

/** Alias legado — preferir VerticalManifest. */
export type VerticalDefinition = VerticalManifest;
