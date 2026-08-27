"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  toCreateMemberPayload,
  toUpdateMemberPayload,
} from "@/features/users-permissions/api/member.mapper";
import { useActorScope } from "@/features/users-permissions/hooks/use-actor-scope";
import {
  useCreateMemberMutation,
  useUpdateMemberMutation,
} from "@/features/users-permissions/hooks/use-member-mutations";
import {
  actorCanAssignScope,
  defaultScopeForActor,
  memberScopeTarget,
} from "@/features/users-permissions/lib/scope-rules";
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
  const { scope: actorScope } = useActorScope();
  const defaultScope = useMemo(
    () => defaultScopeForActor(actorScope),
    [actorScope],
  );

  const initial = useMemo(() => {
    const base = initialValues ?? createEmptyUserFormValues();
    if (initialValues) return base;
    return {
      ...base,
      scopeLevel: defaultScope.level,
      matrixId: defaultScope.matrixId,
      branchIds: [...defaultScope.branchIds],
    };
  }, [initialValues, defaultScope]);

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
    if (!userId && !EMAIL_PATTERN.test(values.email.trim())) {
      toast.error("Informe um e-mail válido.");
      return false;
    }
    if (values.scopeLevel === "matrix" && !values.matrixId) {
      toast.error("Selecione a empresa (matriz) de atuação.");
      return false;
    }
    if (values.scopeLevel === "branch" && values.branchIds.length === 0) {
      toast.error("Selecione ao menos uma filial para este usuário.");
      return false;
    }

    const targetScope = memberScopeTarget({
      scopeLevel: values.scopeLevel,
      matrixId: values.matrixId,
      branchIds: values.branchIds,
    });
    if (!actorCanAssignScope(actorScope, targetScope)) {
      toast.error("Você não pode criar ou alterar usuários fora do seu escopo de atuação.");
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
    actorScope,
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
    actorScope,
  };
}

export type UserFormApi = ReturnType<typeof useUserForm>;
