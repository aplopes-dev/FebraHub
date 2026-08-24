'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicaSettingsContent } from '@/features/clinic/modules/settings/pages/clinica-settings-page';
import {
  canAccessClinicProfileSettings,
  firstAllowedSettingsPath,
} from '@/features/clinic/lib/clinic-settings-access';
import { useVerticalPermissions } from '@/lib/vertical-permissions-context';

export default function ClinicSettingsHomePage() {
  const router = useRouter();
  const { permissions, loading } = useVerticalPermissions();
  const allowed = canAccessClinicProfileSettings(permissions);

  useEffect(() => {
    if (loading || allowed) return;
    const fallback = firstAllowedSettingsPath(permissions) ?? '/';
    router.replace(fallback);
  }, [allowed, loading, permissions, router]);

  if (loading || !allowed) {
    return (
      <p className="text-sm text-muted-foreground">
        {loading ? 'Carregando…' : 'Redirecionando…'}
      </p>
    );
  }

  return <ClinicaSettingsContent />;
}
