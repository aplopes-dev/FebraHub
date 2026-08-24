export type CatalogMenuId = string;

export type CatalogMenu = {
  id: CatalogMenuId;
  name: string;
  /** URL da logo do menu; null = monograma / ícone padrão. */
  logoUrl: string | null;
};

export const ALL_MENUS_ID: CatalogMenuId = 'all';
