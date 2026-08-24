'use client';

import { Suspense } from 'react';
import { EquipeSettingsContent } from '@/features/clinic/modules/settings/team/pages/equipe-settings-page';

export default function ClinicSettingsEquipePage() {
  return (
    <Suspense fallback={null}>
      <EquipeSettingsContent />
    </Suspense>
  );
}
