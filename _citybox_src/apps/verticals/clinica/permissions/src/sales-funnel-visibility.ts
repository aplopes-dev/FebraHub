import { CLINIC_PERMISSION_IDS, expandPermissionIds } from './constants.js';

/** Nomes canônicos dos funis padrão (ensure-defaults). */
export const DEFAULT_SCHEDULE_FUNNEL_NAME = 'Funil de Agendamento';
export const DEFAULT_SALES_FUNNEL_NAME = 'Funil de Venda';

export type SalesFunnelVisibilityInput = {
  name: string;
  isDefault: boolean;
};

/**
 * Quem pode ver um funil no CRM:
 * - `sales_manage_opportunities` → todos
 * - default Agendamento → `sales_view_funnel_schedule`
 * - default Venda → `sales_view_funnel_sales`
 * - `isDefault: false` → `sales_view_clinic_funnels` **ou** `sales_view_funnel_custom`
 *
 * Só `sales_access` não libera nenhum funil.
 */
export function canViewSalesFunnel(
  funnel: SalesFunnelVisibilityInput,
  permissionIds: readonly string[],
): boolean {
  const expanded = expandPermissionIds(permissionIds);

  if (expanded.includes(CLINIC_PERMISSION_IDS.salesManageOpportunities)) {
    return true;
  }

  if (funnel.isDefault) {
    if (funnel.name === DEFAULT_SCHEDULE_FUNNEL_NAME) {
      return expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelSchedule);
    }
    if (funnel.name === DEFAULT_SALES_FUNNEL_NAME) {
      return expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelSales);
    }
    return false;
  }

  return (
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewClinicFunnels) ||
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelCustom)
  );
}

export function filterVisibleSalesFunnels<T extends SalesFunnelVisibilityInput>(
  funnels: readonly T[],
  permissionIds: readonly string[],
): T[] {
  return funnels.filter((funnel) => canViewSalesFunnel(funnel, permissionIds));
}

/** True se o usuário tem pelo menos um checkbox de visualizar funil (ou manage). */
export function canViewAnySalesFunnel(
  permissionIds: readonly string[],
): boolean {
  const expanded = expandPermissionIds(permissionIds);
  return (
    expanded.includes(CLINIC_PERMISSION_IDS.salesManageOpportunities) ||
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelSchedule) ||
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelSales) ||
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewFunnelCustom) ||
    expanded.includes(CLINIC_PERMISSION_IDS.salesViewClinicFunnels)
  );
}
