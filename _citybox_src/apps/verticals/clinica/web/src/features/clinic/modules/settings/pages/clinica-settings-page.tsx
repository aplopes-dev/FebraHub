'use client';

import { useStore } from '@/lib/store-context';
import { ClinicSettingsForm } from '../components/clinic-settings-form';
import { useClinicSettingsState } from '../lib/use-clinic-settings-state';

/** Aba "Clínica" das Configurações — dados gerais da clínica. */
export function ClinicaSettingsContent() {
  const { storeName } = useStore();
  const {
    values,
    patch,
    save,
    isSaving,
    isLoading,
    loadError,
    saveSuccess,
    errors,
    isDirty,
    logoRevision,
    logoPreviewUrl,
    onLogoFileChange,
    onRemoveExistingLogo,
    retryLoad,
  } = useClinicSettingsState({
    storeName,
  });

  return (
    <ClinicSettingsForm
      values={values}
      errors={errors}
      isSaving={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      loadError={loadError}
      saveSuccess={saveSuccess}
      logoPreviewUrl={logoPreviewUrl}
      logoRevision={logoRevision}
      onPatch={patch}
      onLogoFileChange={onLogoFileChange}
      onRemoveExistingLogo={onRemoveExistingLogo}
      onRetryLoad={() => {
        void retryLoad();
      }}
      onSave={() => {
        void save();
      }}
    />
  );
}
