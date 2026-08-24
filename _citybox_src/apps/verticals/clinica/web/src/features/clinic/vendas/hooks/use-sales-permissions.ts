'use client';

import {
  canViewAnySalesFunnel,
  canViewSalesFunnel,
  CLINIC_PERMISSION_IDS,
} from '@citybox/clinica-permissions';
import { useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';

/**
 * Gates de Vendas (CRM).
 *
 * - `sales_access` → abre o módulo.
 * - checkboxes `sales_view_funnel_*` → quais funis aparecem.
 * - `sales_manage_opportunities` → criar/editar/excluir/mover + ver todos os funis
 *   (JSON da Equipe; sem bypass `manage all` do OWNER na UI).
 */
export function useSalesPermissions() {
  const { storeId, accessibleStores } = useStore();
  const clinicPermissions =
    accessibleStores.find((store) => store.id === storeId)?.permissions ?? [];

  const canAccessSales =
    useCan('access', 'Sales') ||
    useCan('read', 'Sales') ||
    useCan('readScheduleFunnel', 'Sales') ||
    useCan('readSalesFunnel', 'Sales') ||
    useCan('readCustomFunnel', 'Sales') ||
    useCan('readClinicFunnels', 'Sales') ||
    useCan('manage', 'Sales');

  const canManageOpportunities = clinicPermissions.includes(
    CLINIC_PERMISSION_IDS.salesManageOpportunities,
  );

  const canViewAnyFunnel = canViewAnySalesFunnel(clinicPermissions);

  return {
    canAccessSales,
    canManageOpportunities,
    canViewAnyFunnel,
    canViewFunnel: (funnel: { name: string; isDefault: boolean }) =>
      canViewSalesFunnel(funnel, clinicPermissions),
    clinicPermissions,
  };
}
