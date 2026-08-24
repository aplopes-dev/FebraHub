import type { StoreVertical } from '../entities/store.entity';

export type StoreRoleCatalogItem = {
  roleKey: string;
  label: string;
};

/**
 * Cargos do ERP Comércio — união dos antigos catálogos de Food e Varejo.
 *
 * Os dois viraram a mesma vertical `'Comércio'`, e o mesmo sistema atende restaurante e
 * loja. Escolher entre um conjunto e outro exigiria um sub-tipo de negócio que a
 * plataforma não modela; oferecer os dois deixa o lojista pegar só o que usa.
 */
const COMERCIO_ROLES: StoreRoleCatalogItem[] = [
  { roleKey: 'gerente', label: 'Gerente de Loja' },
  { roleKey: 'caixa', label: 'Caixa' },
  { roleKey: 'garcom', label: 'Garçom' },
  { roleKey: 'cozinha', label: 'Cozinha' },
  { roleKey: 'estoquista', label: 'Estoquista' },
  { roleKey: 'vendedor', label: 'Vendedor' },
];

const GENERIC_ROLES: StoreRoleCatalogItem[] = [
  { roleKey: 'gerente', label: 'Gerente' },
  { roleKey: 'operador', label: 'Operador' },
  { roleKey: 'atendente', label: 'Atendente' },
];

const IMOVEIS_ROLES: StoreRoleCatalogItem[] = [
  { roleKey: 'admin', label: 'Administrador' },
  { roleKey: 'broker', label: 'Corretor' },
  { roleKey: 'assistant', label: 'Assistente' },
];

const BEAUTIFUL_ROLES: StoreRoleCatalogItem[] = [
  { roleKey: 'owner', label: 'Responsável' },
  { roleKey: 'profissional', label: 'Profissional' },
  { roleKey: 'recepcao', label: 'Recepção' },
];

export function getRoleCatalogForVertical(
  vertical: StoreVertical,
): StoreRoleCatalogItem[] {
  switch (vertical) {
    case 'Comércio':
      return COMERCIO_ROLES;
    case 'Imóveis':
      return IMOVEIS_ROLES;
    case 'Beautiful':
      return BEAUTIFUL_ROLES;
    default:
      return GENERIC_ROLES;
  }
}

export function getRoleCatalogItem(
  vertical: StoreVertical,
  roleKey: string,
): StoreRoleCatalogItem | undefined {
  return getRoleCatalogForVertical(vertical).find(
    (item) => item.roleKey === roleKey,
  );
}

export function isValidRoleForVertical(
  vertical: StoreVertical,
  roleKey: string,
): boolean {
  return getRoleCatalogItem(vertical, roleKey) !== undefined;
}
