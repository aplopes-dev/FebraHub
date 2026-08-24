import type { LucideIcon } from 'lucide-react';
import {
  BarChart3Icon,
  BoxesIcon,
  LayoutGridIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
} from 'lucide-react';

export type PosNavItemId =
  | 'pdv'
  | 'pedidos'
  | 'clientes'
  | 'mesas'
  | 'produtos'
  | 'relatorio'
  | 'estoque'
  | 'configuracoes';

export type PosNavItem = {
  id: PosNavItemId;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const POS_NAV_ITEMS: readonly PosNavItem[] = [
  { id: 'pdv', label: 'PDV', href: '/', icon: StoreIcon },
  { id: 'pedidos', label: 'Pedidos', href: '/pedidos', icon: ShoppingBagIcon },
  { id: 'clientes', label: 'Clientes', href: '/clientes', icon: UsersIcon },
  { id: 'mesas', label: 'Mesas', href: '/mesas', icon: LayoutGridIcon },
  { id: 'produtos', label: 'Produtos', href: '/produtos', icon: PackageIcon },
  {
    id: 'relatorio',
    label: 'Relatório',
    href: '/relatorio',
    icon: BarChart3Icon,
  },
  { id: 'estoque', label: 'Estoque', href: '/estoque', icon: BoxesIcon },
  {
    id: 'configuracoes',
    label: 'Configurações',
    href: '/configuracoes',
    icon: SettingsIcon,
  },
] as const;

export function resolveActivePosNavId(pathname: string): PosNavItemId {
  const normalized = pathname === '' ? '/' : pathname;
  const match = POS_NAV_ITEMS.find((item) => {
    if (item.href === '/') return normalized === '/';
    return normalized === item.href || normalized.startsWith(`${item.href}/`);
  });
  return match?.id ?? 'pdv';
}
