'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  redirectPathForDisabledNavPath,
  verticalBasePath,
} from '@/lib/vertical/navigation-utils';
import { getCachedVerticalManifest } from '@/lib/vertical/registry';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import { useVerticalPermissions } from '@/lib/vertical-permissions-context';

export function VerticalRouteGuard({
  verticalId,
  children,
}: {
  verticalId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { permissions, loading, loadError, navModules } = useVerticalPermissions();
  const { manifest } = useVerticalManifest();
  const definition = manifest ?? getCachedVerticalManifest(verticalId);
  const basePath = verticalBasePath(verticalId);
  const navDefaults = definition?.navDefaults;

  const disabledRedirect =
    definition !== null
      ? redirectPathForDisabledNavPath(
          pathname,
          definition.navModules,
          basePath,
          navDefaults,
        )
      : null;

  const allowed =
    !loading &&
    definition !== null &&
    disabledRedirect === null &&
    definition.permissions.canAccessPath(pathname, definition.navModules, permissions);
  const fallback = navModules[0]?.children.find((leaf) => !leaf.disabled)?.path ?? basePath;

  useEffect(() => {
    if (loading) return;
    if (disabledRedirect && pathname !== disabledRedirect) {
      router.replace(disabledRedirect);
      return;
    }
    if (allowed) return;
    if (pathname !== fallback) router.replace(fallback);
  }, [allowed, disabledRedirect, fallback, loading, pathname, router]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando permissões…</p>;
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {loadError}
      </p>
    );
  }

  if (disabledRedirect) {
    return <p className="text-sm text-muted-foreground">Redirecionando…</p>;
  }

  if (!allowed) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Você não tem permissão para esta página nesta loja.
      </p>
    );
  }

  return <>{children}</>;
}
