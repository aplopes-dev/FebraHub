'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/features/clinic/modules/patients/hooks/use-debounced-value';
import { useAbility } from '@/features/clinic/permissions/use-ability';
import { useStore } from '@/lib/store-context';
import { getVerticalDefinition } from '@/lib/vertical/registry';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import { useVerticalPermissions } from '@/lib/vertical-permissions-context';
import { clinicGlobalSearch } from '../services/clinic-global-search.service';
import type { GlobalSearchResult } from '../types';

export const clinicGlobalSearchKeys = {
  all: ['clinic-global-search'] as const,
  query: (storeId: string, q: string, accessKey: string) =>
    [...clinicGlobalSearchKeys.all, storeId, q, accessKey] as const,
};

export function useClinicGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const { storeId, version } = useStore();
  const { navModules, permissions, verticalId } = useVerticalPermissions();
  const { manifest } = useVerticalManifest();
  const definition = manifest ?? getVerticalDefinition(verticalId);

  const ability = useAbility();
  const canReadPatients =
    ability?.can('read', 'Patient') || ability?.can('access', 'Patient') || false;
  const canReadSales =
    ability?.can('access', 'Sales') ||
    ability?.can('read', 'Sales') ||
    ability?.can('readScheduleFunnel', 'Sales') ||
    ability?.can('readSalesFunnel', 'Sales') ||
    ability?.can('readCustomFunnel', 'Sales') ||
    ability?.can('readClinicFunnels', 'Sales') ||
    ability?.can('manage', 'Sales') ||
    false;
  const canReadAppointments =
    ability?.can('read', 'Schedule') || ability?.can('access', 'Schedule') || false;
  const canReadStock =
    ability?.can('access', 'Stock') || ability?.can('manage', 'Stock') || false;

  const accessKey = useMemo(
    () =>
      [
        version,
        permissions.join(','),
        canReadPatients,
        canReadSales,
        canReadAppointments,
        canReadStock,
      ].join('|'),
    [
      version,
      permissions,
      canReadPatients,
      canReadSales,
      canReadAppointments,
      canReadStock,
    ],
  );

  const canAccessHref = useCallback(
    (href: string) => {
      if (!definition) return false;
      const pathOnly = href.split('?')[0] ?? href;
      return (
        definition.permissions.canAccessPath(pathOnly, definition.navModules, permissions) ||
        definition.permissions.canAccessPath(href, definition.navModules, permissions)
      );
    },
    [definition, permissions],
  );

  const enabled = open && Boolean(storeId);

  const searchQuery = useQuery({
    queryKey: clinicGlobalSearchKeys.query(
      storeId ?? '',
      debouncedQuery.trim(),
      accessKey,
    ),
    queryFn: () =>
      clinicGlobalSearch(debouncedQuery, navModules, {
        storeId: storeId!,
        canAccessHref,
        canSearchPatients: canReadPatients,
        canSearchOpportunities: canReadSales,
        canSearchAppointments: canReadAppointments,
        canSearchStock: canReadStock,
      }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const result: GlobalSearchResult = useMemo(() => {
    if (searchQuery.data) return searchQuery.data;
    return { groups: [] };
  }, [searchQuery.data]);

  const isFetching =
    searchQuery.isFetching && query.trim() === debouncedQuery.trim();

  return {
    open,
    setOpen,
    query,
    setQuery,
    result,
    isLoading: isFetching || (searchQuery.isLoading && enabled),
    onOpenChange: (next: boolean) => {
      setOpen(next);
      if (!next) setQuery('');
    },
  };
}
