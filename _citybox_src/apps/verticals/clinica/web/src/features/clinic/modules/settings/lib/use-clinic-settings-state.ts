'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { clinicSettingsKeys } from '../hooks/query-keys';
import {
  deleteClinicLogo,
  getClinicProfile,
  uploadClinicLogo,
  upsertClinicProfile,
  type ClinicProfilePayload,
} from '../services/clinic-profile.service';
import { createInitialClinicSettings } from '../data/mock-clinic-settings';
import type { ClinicSettingsFormData, ClinicSettingsFormPatch } from '../types/clinic-settings';
import {
  EMPTY_CLINIC_LOGO_STATE,
  type ClinicLogoImageState,
} from '../types/clinic-logo-state';
import {
  type ClinicSettingsValidationErrors,
  validateClinicSettingsFields,
} from './format-clinic-fields';

const SAVE_SUCCESS_DURATION_MS = 3000;

type UseClinicSettingsStateOptions = {
  storeName?: string;
};

function toProfilePayload(values: ClinicSettingsFormData): ClinicProfilePayload {
  return {
    clinicName: values.clinicName,
    cnpj: values.cnpj,
    communicationsName: values.communicationsName,
    responsible: values.responsible,
    openingTime: values.openingTime,
    closingTime: values.closingTime,
    email: values.email,
    phone: values.phone,
    mobile: values.mobile,
    cep: values.cep,
    street: values.street,
    number: values.number,
    complement: values.complement,
    neighborhood: values.neighborhood,
    city: values.city,
    state: values.state,
  };
}

function profilesEqual(a: ClinicSettingsFormData, b: ClinicSettingsFormData): boolean {
  const { logoUrl: _a, ...restA } = a;
  const { logoUrl: _b, ...restB } = b;
  return JSON.stringify(restA) === JSON.stringify(restB);
}

export function useClinicSettingsState({ storeName }: UseClinicSettingsStateOptions = {}) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const [values, setValues] = useState<ClinicSettingsFormData>(() =>
    createInitialClinicSettings(storeName),
  );
  const [savedValues, setSavedValues] = useState<ClinicSettingsFormData>(() =>
    createInitialClinicSettings(storeName),
  );
  const [logoState, setLogoState] = useState<ClinicLogoImageState>(EMPTY_CLINIC_LOGO_STATE);
  const [savedLogoState, setSavedLogoState] = useState<ClinicLogoImageState>(EMPTY_CLINIC_LOGO_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<ClinicSettingsValidationErrors>({});
  const [logoRevision, setLogoRevision] = useState(0);

  const profileQuery = useQuery({
    queryKey: clinicSettingsKeys.profile(storeId),
    queryFn: () => getClinicProfile(storeId),
    enabled: Boolean(storeId),
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    const loaded = profileQuery.data;
    const withStoreName =
      storeName && !loaded.clinicName
        ? { ...loaded, clinicName: storeName }
        : loaded;

    setValues(withStoreName);
    setSavedValues(withStoreName);
    setLogoState(EMPTY_CLINIC_LOGO_STATE);
    setSavedLogoState(EMPTY_CLINIC_LOGO_STATE);
    setLogoRevision((current) => current + 1);
  }, [profileQuery.data, storeName]);

  useEffect(() => {
    if (!saveSuccess) return;

    const timer = window.setTimeout(() => setSaveSuccess(false), SAVE_SUCCESS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  const patch = useCallback((patchValues: ClinicSettingsFormPatch) => {
    setValues((current) => ({ ...current, ...patchValues }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patchValues) as Array<keyof ClinicSettingsFormPatch>) {
        if (key in next) {
          delete next[key as keyof ClinicSettingsValidationErrors];
        }
      }
      return next;
    });
  }, []);

  const onLogoFileChange = useCallback((file: File | null) => {
    setLogoState((current) => ({
      ...current,
      pendingFile: file,
      removeExisting: file ? false : current.removeExisting,
    }));
  }, []);

  const onRemoveExistingLogo = useCallback(() => {
    setLogoState({ pendingFile: null, removeExisting: true });
    setValues((current) => ({ ...current, logoUrl: undefined }));
  }, []);

  const save = useCallback(async () => {
    if (!storeId) {
      toast.error('Selecione uma loja para salvar as configurações.');
      return false;
    }

    const validationErrors = validateClinicSettingsFields(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setIsSaving(true);
    setErrors({});

    try {
      let profile = await upsertClinicProfile(storeId, toProfilePayload(values));

      if (logoState.pendingFile) {
        profile = await uploadClinicLogo(storeId, logoState.pendingFile);
      } else if (logoState.removeExisting) {
        profile = await deleteClinicLogo(storeId);
      }

      const nextLogoState = EMPTY_CLINIC_LOGO_STATE;
      setValues(profile);
      setSavedValues(profile);
      setLogoState(nextLogoState);
      setSavedLogoState(nextLogoState);
      setLogoRevision((current) => current + 1);
      setSaveSuccess(true);

      queryClient.setQueryData(clinicSettingsKeys.profile(storeId), profile);

      await queryClient.invalidateQueries({
        queryKey: clinicSettingsKeys.profile(storeId),
      });

      return true;
    } catch (error) {
      toastClinicaMutationError(
        error,
        'Não foi possível salvar as configurações da clínica.',
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [logoState.pendingFile, logoState.removeExisting, queryClient, storeId, values]);

  const logoPreviewUrl = useMemo(() => {
    if (logoState.removeExisting) return undefined;
    return values.logoUrl;
  }, [logoState.removeExisting, values.logoUrl]);

  const isDirty =
    !profilesEqual(values, savedValues) ||
    logoState.pendingFile !== savedLogoState.pendingFile ||
    logoState.removeExisting !== savedLogoState.removeExisting;

  return {
    values,
    patch,
    save,
    isSaving,
    isLoading: profileQuery.isLoading,
    loadError: profileQuery.error,
    saveSuccess,
    errors,
    isDirty,
    logoRevision,
    logoPreviewUrl,
    onLogoFileChange,
    onRemoveExistingLogo,
    retryLoad: () => profileQuery.refetch(),
  };
}
