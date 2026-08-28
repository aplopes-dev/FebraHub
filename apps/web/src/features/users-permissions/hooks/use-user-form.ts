"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  toCreateMemberPayload,
  toUpdateMemberPayload,
} from "@/features/users-permissions/api/member.mapper";
import {
  useCreateMemberMutation,
  useUpdateMemberMutation,
} from "@/features/users-permissions/hooks/use-member-mutations";
import {
  createEmptyUserFormValues,
  type CreateMemberResult,
  type UserFormValues,
  type UserGeneralSettings,
} from "@/features/users-permissions/types/user";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UseUserFormOptions = {
  userId?: string;
  initialValues?: UserFormValues;
  profileOptions?: PermissionProfileOption[];
  onCreated?: (result: CreateMemberResult) => void;
  onSaved?: () => void;
};

export function useUserForm({
  userId,
  initialValues,
  profileOptions = [],
  onCreated,
  onSaved,
}: UseUserFormOptions = {}) {
  const initial = useMemo(
    () => initialValues ?? createEmptyUserFormValues(),
    [initialValues],
  );

  const [values, setValues] = useState<UserFormValues>(initial);
  const [baseline, setBaseline] = useState<UserFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const createMutation = useCreateMemberMutation();
  const updateMutation = useUpdateMemberMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(baseline),
    [values, baseline],
  );

  const setField = useCallback(
    <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setSetting = useCallback(
    <Key extends keyof UserGeneralSettings>(
      key: Key,
      value: UserGeneralSettings[Key],
    ) => {
      setValues((prev) => ({
        ...prev,
        settings: { ...prev.settings, [key]: value },
      }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(baseline);
  }, [baseline]);

  const save = useCallback(async () => {
    if (!values.profileId) {
      toast.error("Selecione o perfil de acesso do usuário.");
      return false;
    }
    if (!values.name.trim()) {
      toast.error("Informe o nome do usuário.");
      return false;
    }
    if (!values.sector) {
      toast.error("Selecione o setor principal do usuário.");
      return false;
    }
    if (!userId && !EMAIL_PATTERN.test(values.email.trim())) {
      toast.error("Informe um e-mail válido.");
      return false;
    }
    try {
      if (userId) {
        await updateMutation.mutateAsync({
          id: userId,
          payload: toUpdateMemberPayload(values),
        });
        setBaseline(values);
        setHasSavedOnce(true);
        onSaved?.();
        return true;
      }

      const result = await createMutation.mutateAsync(
        toCreateMemberPayload(values),
      );
      toast.success("Usuário criado", { description: result.member.name });
      setBaseline(values);
      setHasSavedOnce(true);
      onCreated?.(result);
      return true;
    } catch {
      return false;
    }
  }, [
    userId,
    values,
    createMutation,
    updateMutation,
    onCreated,
    onSaved,
  ]);

  return {
    values,
    setField,
    setSetting,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving,
    isEditing: Boolean(userId),
  };
}

export type UserFormApi = ReturnType<typeof useUserForm>;
