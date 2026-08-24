'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLogoutGate, useRequireAuth } from '@/components/auth/auth-logout-gate';
import { ClinicErpLayout } from '@/features/clinic/layout/clinic-erp-layout';
import { VerticalRouteGuard } from '@/shell/vertical-route-guard';
import { StoreLoadingShell } from '@/shell/components/store-loading-shell';
import { VerticalBrandingProvider } from '@/lib/vertical-branding-context';
import { VerticalPermissionsProvider } from '@/lib/vertical-permissions-context';
import {
  VerticalDefinitionProvider,
  useVerticalManifest,
} from '@/lib/vertical/vertical-definition-context';
import { getModule } from '@/lib/modules';
import { usePermissions } from '@/lib/permissions-context';
import { useSession } from '@/lib/session-context';
import { CLINIC_VERTICAL_ID } from '@/lib/store-routing';
import { useStore } from '@/lib/store-context';
import { PermissionDeniedDialog } from '@/features/clinic/shared/components/permission-denied-dialog';

const VERTICAL_ID = CLINIC_VERTICAL_ID;

function ClinicShellInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  useRequireAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const { storeVertical, storeId, loading: storeLoading } = useStore();
  const { manifest, loading: manifestLoading, loadError } = useVerticalManifest();

  const mod = getModule(VERTICAL_ID);
  const permission =
    mod?.permission ?? manifest?.platformPermission ?? `vertical.${VERTICAL_ID}.view`;
  const label = mod?.label ?? manifest?.label ?? VERTICAL_ID;
  const storeReady = !storeLoading && storeVertical === VERTICAL_ID;

  useEffect(() => {
    if (storeLoading || permissionsLoading) return;
    // Sem clínica ativa, ou uma loja de outra vertical persistida no navegador:
    // manda escolher. Não há outra rota de vertical para onde redirecionar aqui.
    if (!storeId || (storeVertical && storeVertical !== VERTICAL_ID)) {
      router.replace('/selecionar-loja');
    }
  }, [permissionsLoading, router, storeId, storeLoading, storeVertical]);

  return (
    <AuthLogoutGate>
      {manifestLoading || status === 'loading' || permissionsLoading || !storeReady ? (
        <StoreLoadingShell message="Carregando clínica…" />
      ) : loadError || !manifest ? (
        <p className="p-6 text-sm text-destructive" role="alert">
          {loadError ?? `Módulo ${VERTICAL_ID} indisponível.`}
        </p>
      ) : !hasPermission(permission) ? (
        <p className="p-6 text-sm text-foreground">
          Sem permissão para o módulo {label} ({permission}). Solicite acesso ao administrador da clínica.
        </p>
      ) : (
        <VerticalPermissionsProvider verticalId={VERTICAL_ID}>
          <VerticalBrandingProvider verticalId={VERTICAL_ID}>
            <ClinicErpLayout verticalId={VERTICAL_ID}>
              <VerticalRouteGuard verticalId={VERTICAL_ID}>{children}</VerticalRouteGuard>
            </ClinicErpLayout>
            <PermissionDeniedDialog />
          </VerticalBrandingProvider>
        </VerticalPermissionsProvider>
      )}
    </AuthLogoutGate>
  );
}

export function ClinicShell({ children }: { children: ReactNode }) {
  return (
    <VerticalDefinitionProvider verticalId={VERTICAL_ID}>
      <ClinicShellInner>{children}</ClinicShellInner>
    </VerticalDefinitionProvider>
  );
}
