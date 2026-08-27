"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import { toSavePermissionProfilePayload } from "@/features/users-permissions/api/permission-profile.mapper";
import {
  useCreatePermissionProfileMutation,
  useUpdatePermissionProfileMutation,
} from "@/features/users-permissions/hooks/use-permission-profile-mutations";
import {
  createEmptyPermissionProfileFormValues,
  type PermissionProfileFormValues,
} from "@/features/users-permissions/types/permission-profile";

type UsePermissionProfileFormOptions = {
  profileId?: string;
  initialValues?: PermissionProfileFormValues;
  onSaved?: () => void;
};

export function usePermissionProfileForm({
  profileId,
  initialValues,
  onSaved,
}: UsePermissionProfileFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptyPermissionProfileFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<PermissionProfileFormValues>(initial);
  const [baseline, setBaseline] = useState<PermissionProfileFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const createMutation = useCreatePermissionProfileMutation();
  const updateMutation = useUpdatePermissionProfileMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <Key extends keyof PermissionProfileFormValues>(
      key: Key,
      value: PermissionProfileFormValues[Key],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setPermissionIds = useCallback((next: Set<string>) => {
    setValues((prev) => ({ ...prev, permissionIds: [...next] }));
  }, []);

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(async () => {
    if (!values.name.trim()) {
      toast.error("Informe o nome do perfil.");
      return false;
    }

    const payload = toSavePermissionProfilePayload(values);

    try {
      if (profileId) {
        await updateMutation.mutateAsync({ id: profileId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setBaseline(values);
      setHasSavedOnce(true);
      onSaved?.();
      return true;
    } catch {
      return false;
    }
  }, [profileId, values, createMutation, updateMutation, onSaved]);

  return {
    values,
    setField,
    setPermissionIds,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving,
    isEditing: Boolean(profileId),
  };
}

export type PermissionProfileFormApi = ReturnType<typeof usePermissionProfileForm>;
