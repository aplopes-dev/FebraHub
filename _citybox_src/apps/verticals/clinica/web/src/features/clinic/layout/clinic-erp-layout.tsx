'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@citybox/ui/organisms';
import type { SidebarLinkProps, SidebarNavGroup } from '@citybox/ui/organisms';
import { Logo } from '@citybox/ui/molecules';
import { getCachedVerticalManifest } from '@/lib/vertical/registry';
import { resolveVerticalNavHit } from '@/lib/vertical/nav-hooks';
import { useVerticalBranding } from '@/lib/vertical-branding-context';
import { useVerticalPermissions } from '@/lib/vertical-permissions-context';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import { useStore } from '@/lib/store-context';
import { resolveVerticalHeader } from '@/shell/lib/resolve-vertical-header';
import { StoreLoadingShell } from '@/shell/components/store-loading-shell';
import { resolveClinicLeafIcon } from '@/features/clinic/lib/icons';

/** Adaptador de link do AppSidebar para o roteador do Next.js. */
function NextSidebarLink({ href, children, ...props }: SidebarLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

/**
 * Layout da vertical Clínica com sidebar de UMA coluna (AppSidebar).
 * Difere de food/varejo, que usam AppSidebarDual (duas colunas).
 */
export function ClinicErpLayout({
  verticalId,
  children,
}: {
  verticalId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { storeName, storeId } = useStore();
  const { manifest } = useVerticalManifest();
  const definition = manifest ?? getCachedVerticalManifest(verticalId);
  const { displayName } = useVerticalBranding();
  const { navModules, loading: permsLoading, loadError } = useVerticalPermissions();
  const brand = definition?.brand;
  const theme = definition?.theme;

  if (!definition) {
    return (
      <p className="text-sm text-muted-foreground">
        Módulo vertical desconhecido: {verticalId}
      </p>
    );
  }

  if (permsLoading || !storeId) {
    return <StoreLoadingShell message="Carregando clínica…" />;
  }

  if (loadError) {
    return (
      <p className="p-6 text-sm text-destructive" role="alert">
        {loadError}
      </p>
    );
  }

  if (navModules.length === 0) {
    return (
      <p className="p-6 text-sm text-foreground">
        Nenhum módulo {brand?.shortName ?? verticalId} disponível para esta loja. Solicite permissões
        ao administrador.
      </p>
    );
  }

  const hit = resolveVerticalNavHit(definition, pathname);
  const activeLeafId = hit?.leaf.id;
  const navGroups: SidebarNavGroup[] = navModules.map((mod) => ({
    label: mod.label,
    items: mod.children.map((leaf) => ({
      title: leaf.label,
      url: leaf.path,
      icon: resolveClinicLeafIcon(leaf.id),
      isActive: leaf.id === activeLeafId,
    })),
  }));

  const storeLabel = displayName || storeName || brand?.name || verticalId;

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1">
        <AppSidebar
          fillViewport
          navGroups={navGroups}
          brandName={brand?.shortName ?? verticalId}
          brandSubtitle={storeLabel}
          brandLogo={
            <div className="flex items-center gap-2">
              <Logo
                variant="symbol"
                className="h-9 w-9"
                brandColor={theme?.primaryColor}
                brandGradient={theme?.brandGradient}
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{brand?.shortName ?? verticalId}</span>
                <span className="truncate text-xs text-muted-foreground">{storeLabel}</span>
              </div>
            </div>
          }
          brandLogoCollapsed={
            <Logo
              variant="symbol"
              className="h-9 w-9"
              brandColor={theme?.primaryColor}
              brandGradient={theme?.brandGradient}
            />
          }
          linkComponent={NextSidebarLink}
          breadcrumb={resolveVerticalHeader(verticalId)}
        >
          {children}
        </AppSidebar>
      </div>
    </div>
  );
}
