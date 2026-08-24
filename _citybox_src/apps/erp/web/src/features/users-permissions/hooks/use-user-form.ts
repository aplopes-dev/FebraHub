"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import {
  toCreateMemberPayload,
  toUpdateMemberPayload,
} from "@/features/users-permissions/api/member.mapper";
import {
  setMemberPdvPin,
  updateMember,
} from "@/features/users-permissions/api/members.service";
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
import { ComercioApiError } from "@/lib/api/comercio-client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UseUserFormOptions = {
  userId?: string;
  initialValues?: UserFormValues;
  /** Perfis ativos — para saber se o selecionado exige unidades. */
  profileOptions?: PermissionProfileOption[];
  onCreated?: (result: CreateMemberResult) => void;
  onSaved?: () => void;
};

function profileRequiresBranches(
  profileId: string,
  options: PermissionProfileOption[],
): boolean {
  const profile = options.find((item) => item.id === profileId);
  // Perfil administrador (systemKey) vira ADMIN na API → acessa todas as unidades.
  if (!profile) return true;
  if (profile.systemKey === "administrador" || profile.isSystem) return false;
  return true;
}

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

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
  /** PIN escolhido no create — só vai para a API depois do membro existir. */
  const [pendingPdvPin, setPendingPdvPin] = useState<string | null>(null);

  const createMutation = useCreateMemberMutation();
  const updateMutation = useUpdateMemberMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isDirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(baseline) ||
      pendingPdvPin !== null,
    [values, baseline, pendingPdvPin],
  );

  const requiresBranches = profileRequiresBranches(
    values.profileId,
    profileOptions,
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
    setPendingPdvPin(null);
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
    if (requiresBranches && values.branchIds.length === 0) {
      toast.error("Selecione ao menos uma unidade para este usuário.");
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
      const pdvCode = values.pdvCode.trim();
      const pin = pendingPdvPin;

      if (pdvCode || pin) {
        try {
          if (pin && pdvCode) {
            await setMemberPdvPin(result.member.id, { pin, pdvCode });
          } else if (pdvCode) {
            await updateMember(result.member.id, { pdvCode });
          }
        } catch (error) {
          toast.error("Usuário criado, mas o PIN/código PDV falhou", {
            description: `${errorMessage(error)}. Abra o usuário e defina o PIN de novo.`,
          });
          setPendingPdvPin(null);
          setBaseline(values);
          setHasSavedOnce(true);
          onCreated?.(result);
          return true;
        }
      }

      toast.success("Usuário criado", { description: result.member.name });
      setPendingPdvPin(null);
      setBaseline(values);
      setHasSavedOnce(true);
      onCreated?.(result);
      return true;
    } catch {
      // Toast já disparado pela mutation.
      return false;
    }
  }, [
    userId,
    values,
    pendingPdvPin,
    requiresBranches,
    createMutation,
    updateMutation,
    onCreated,
    onSaved,
  ]);

  return {
    values,
    setField,
    setSetting,
    pendingPdvPin,
    setPendingPdvPin,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving,
    isEditing: Boolean(userId),
    requiresBranches,
  };
}

export type UserFormApi = ReturnType<typeof useUserForm>;
