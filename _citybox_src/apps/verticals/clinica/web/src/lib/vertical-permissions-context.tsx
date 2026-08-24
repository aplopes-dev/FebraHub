'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { getVerticalDefinition } from '@/lib/vertical/registry';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import type { VerticalNavModule } from '@/lib/vertical/types';
import { verticalPermission } from '@/lib/store-routing';
import { usePermissions } from '@/lib/permissions-context';
import { useStore } from '@/lib/store-context';
import { useSession } from '@/lib/session-context';

type VerticalPermissionsContextValue = {
  verticalId: string;
  permissions: string[];
  loading: boolean;
  loadError: string | null;
  canManageRoles: boolean;
  navModules: VerticalNavModule[];
  canAccess: (required: string[]) => boolean;
  refresh: () => Promise<void>;
};

const VerticalPermissionsContext = createContext<VerticalPermissionsContextValue | null>(null);

export function VerticalPermissionsProvider({
  verticalId,
  children,
}: {
  verticalId: string;
  children: ReactNode;
}) {
  const { manifest, loading: manifestLoading } = useVerticalManifest();
  const definition = manifest ?? getVerticalDefinition(verticalId);
  const { storeId, version } = useStore();
  const { status } = useSession();
  const {
    permissions: platformPermissions,
    hasPermission,
    loading: platformPermissionsLoading,
  } = usePermissions();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!definition) {
      setPermissions([]);
      setCanManageRoles(false);
      setLoadError('Vertical desconhecida.');
      setLoading(false);
      return;
    }

    if (!storeId) {
      setPermissions([]);
      setCanManageRoles(false);
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      if (definition.usesStorePermissionsApi && definition.services) {
        const data = await definition.services.fetchMyStorePermissions(storeId);
        setPermissions(data.permissions);
        setCanManageRoles(data.canManageRoles);
      } else {
        const viewPerm = verticalPermission(verticalId);
        setPermissions(
          hasPermission(viewPerm) ? [viewPerm, ...platformPermissions] : platformPermissions,
        );
        setCanManageRoles(false);
      }
    } catch {
      setPermissions([]);
      setCanManageRoles(false);
      setLoadError('Não foi possível carregar permissões da loja.');
    } finally {
      setLoading(false);
    }
  }, [definition, hasPermission, platformPermissions, storeId, verticalId]);

  useEffect(() => {
    if (status === 'loading' || platformPermissionsLoading || manifestLoading) return;
    void load();
  }, [load, manifestLoading, platformPermissionsLoading, status, version]);

  const navModules = useMemo(() => {
    if (!definition || loading) return [];
    return definition.permissions.filterNavModules(definition.navModules, permissions);
  }, [definition, loading, permissions]);

  const canAccess = useCallback(
    (required: string[]) => definition?.permissions.canAccessWithAnyOf(permissions, required) ?? false,
    [definition, permissions],
  );

  return (
    <VerticalPermissionsContext.Provider
      value={{
        verticalId,
        permissions,
        loading,
        loadError,
        canManageRoles,
        navModules,
        canAccess,
        refresh: load,
      }}
    >
      {children}
    </VerticalPermissionsContext.Provider>
  );
}

export function useVerticalPermissions() {
  const ctx = useContext(VerticalPermissionsContext);
  if (!ctx) {
    throw new Error('useVerticalPermissions deve ser usado dentro de VerticalPermissionsProvider');
  }
  return ctx;
}

export function useVerticalPageAccess() {
  const pathname = usePathname();
  const { verticalId, permissions, loading, canManageRoles } = useVerticalPermissions();
  const { manifest } = useVerticalManifest();
  const definition = manifest ?? getVerticalDefinition(verticalId);

  if (!definition) {
    return { canRead: false, canWrite: false, readOnly: false, loading };
  }

  const canRead = definition.permissions.canAccessPath(pathname, definition.navModules, permissions);
  const rolesPrefix = definition.rolesAdminPathPrefix;
  const onPermissionsAdmin =
    rolesPrefix !== undefined &&
    (pathname === rolesPrefix || pathname.startsWith(`${rolesPrefix}/`));
  const canWrite = onPermissionsAdmin
    ? canManageRoles
    : definition.permissions.canWritePath(pathname, definition.navModules, permissions);

  return {
    canRead,
    canWrite,
    readOnly: canRead && !canWrite,
    loading,
  };
}
