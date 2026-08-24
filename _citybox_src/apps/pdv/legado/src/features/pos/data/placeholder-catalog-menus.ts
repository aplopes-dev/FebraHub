import type { LucideIcon } from 'lucide-react';
import {
  CoffeeIcon,
  CupSodaIcon,
  DrumstickIcon,
  EllipsisIcon,
  IceCreamConeIcon,
  LayoutGridIcon,
  SandwichIcon,
} from 'lucide-react';
import type { CatalogMenu } from '../types/catalog-menu';
import { ALL_MENUS_ID } from '../types/catalog-menu';

export type CatalogMenuWithIcon = CatalogMenu & {
  icon: LucideIcon;
};

/** Menus mock do catálogo até integrar API (food/varejo). */
export const PLACEHOLDER_CATALOG_MENUS: readonly CatalogMenuWithIcon[] = [
  { id: ALL_MENUS_ID, name: 'Todos', logoUrl: null, icon: LayoutGridIcon },
  {
    id: 'menu-hamburguer',
    name: 'Hambúrguer',
    logoUrl: null,
    icon: SandwichIcon,
  },
  {
    id: 'menu-frango-frito',
    name: 'Frango frito',
    logoUrl: null,
    icon: DrumstickIcon,
  },
  { id: 'menu-bebidas', name: 'Bebidas', logoUrl: null, icon: CupSodaIcon },
  { id: 'menu-cafe', name: 'Café', logoUrl: null, icon: CoffeeIcon },
  {
    id: 'menu-sorvete',
    name: 'Sorvete',
    logoUrl: null,
    icon: IceCreamConeIcon,
  },
  { id: 'menu-outros', name: 'Outros', logoUrl: null, icon: EllipsisIcon },
] as const;
