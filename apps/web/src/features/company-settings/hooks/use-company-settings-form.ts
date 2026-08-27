"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useOrganization } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import type { BranchAddress } from "@/features/branches/types/branch";
import {
  deleteGroupLogoApi,
  updateCurrentGroupApi,
  uploadGroupLogoApi,
} from "@/features/company-settings/api/group-current.service";
import { groupLogoProxyUrl } from "@/features/company-settings/api/group-logo-url";
import {
  toGroupSettingsValues,
  toUpdateGroupPayload,
} from "@/features/company-settings/api/group-current.mapper";
import { groupCurrentKeys } from "@/features/company-settings/hooks/query-keys";
import { useCurrentGroupQuery } from "@/features/company-settings/hooks/use-group-current-queries";
import {
  createEmptyGroupSettingsValues,
  type GroupSettingsValues,
} from "../types/company";

export function useCompanySettingsForm() {
  const queryClient = useQueryClient();
  const { organizationId } = useOrganization();
  const groupQuery = useCurrentGroupQuery();

  const [values, setValues] = useState<GroupSettingsValues>(
    createEmptyGroupSettingsValues(),
  );
  const [baseline, setBaseline] = useState<GroupSettingsValues>(
    createEmptyGroupSettingsValues(),
  );
  const [meta, setMeta] = useState<{
    createdAt: string | null;
    unitsCount: number;
  }>({ createdAt: null, unitsCount: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [hasSavedLogo, setHasSavedLogo] = useState(false);
  const [savedLogoCacheKey, setSavedLogoCacheKey] = useState<string | null>(
    null,
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoRemove, setPendingLogoRemove] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!groupQuery.data) return;
    const next = toGroupSettingsValues(groupQuery.data);
    setValues(next);
    setBaseline(next);
    setMeta({
      createdAt: groupQuery.data.createdAt,
      unitsCount: groupQuery.data.unitsCount,
    });
    setHasSavedLogo(Boolean(groupQuery.data.hasLogo));
    setSavedLogoCacheKey(groupQuery.data.updatedAt);
    setPendingLogoFile(null);
    setPendingLogoRemove(false);
    setLogoPreviewUrl(
      groupQuery.data.hasLogo
        ? groupLogoProxyUrl(groupQuery.data.updatedAt)
        : null,
    );
    setHydrated(true);
    setHasSavedOnce(false);
  }, [groupQuery.data]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(baseline) ||
      pendingLogoFile !== null ||
      pendingLogoRemove,
    [values, baseline, pendingLogoFile, pendingLogoRemove],
  );

  const setField = useCallback(
    <Key extends keyof GroupSettingsValues>(
      key: Key,
      value: GroupSettingsValues[Key],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setAddressField = useCallback(
    <Key extends keyof BranchAddress>(key: Key, value: BranchAddress[Key]) => {
      setValues((prev) => ({
        ...prev,
        adminAddress: { ...prev.adminAddress, [key]: value },
      }));
    },
    [],
  );

  const patchAddress = useCallback((partial: Partial<BranchAddress>) => {
    setValues((prev) => ({
      ...prev,
      adminAddress: { ...prev.adminAddress, ...partial },
    }));
  }, []);

  const setLogoFile = useCallback((file: File) => {
    setLogoPreviewUrl((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setPendingLogoFile(file);
    setPendingLogoRemove(false);
  }, []);

  const removeLogo = useCallback(() => {
    setLogoPreviewUrl((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return null;
    });
    setPendingLogoFile(null);
    setPendingLogoRemove(hasSavedLogo);
  }, [hasSavedLogo]);

  const save = useCallback(async () => {
    if (!values.legalName.trim()) {
      toast.error("Nome do grupo obrigatório");
      return;
    }
    if (!values.email.trim()) {
      toast.error("E-mail de contato obrigatório");
      return;
    }

    setIsSaving(true);
    try {
      let updated = await updateCurrentGroupApi(toUpdateGroupPayload(values));
      if (pendingLogoRemove && !pendingLogoFile) {
        updated = await deleteGroupLogoApi();
      }
      if (pendingLogoFile) {
        updated = await uploadGroupLogoApi(pendingLogoFile);
      }
      const next = toGroupSettingsValues(updated);
      setValues(next);
      setBaseline(next);
      setMeta({
        createdAt: updated.createdAt,
        unitsCount: updated.unitsCount,
      });
      setHasSavedLogo(Boolean(updated.hasLogo));
      setSavedLogoCacheKey(updated.updatedAt);
      setPendingLogoFile(null);
      setPendingLogoRemove(false);
      setLogoPreviewUrl(
        updated.hasLogo ? groupLogoProxyUrl(updated.updatedAt) : null,
      );
      setHasSavedOnce(true);
      await queryClient.invalidateQueries({
        queryKey: groupCurrentKeys.detail(organizationId),
      });
      toast.success("Configurações salvas", {
        description: "Os dados do grupo foram atualizados.",
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar os dados do grupo.";
      toast.error("Erro ao salvar", { description: message });
    } finally {
      setIsSaving(false);
    }
  }, [
    values,
    pendingLogoFile,
    pendingLogoRemove,
    organizationId,
    queryClient,
  ]);

  const discard = useCallback(() => {
    setValues(baseline);
    setPendingLogoFile(null);
    setPendingLogoRemove(false);
    setLogoPreviewUrl((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return hasSavedLogo && savedLogoCacheKey
        ? groupLogoProxyUrl(savedLogoCacheKey)
        : null;
    });
    toast.info("Alterações descartadas");
  }, [baseline, hasSavedLogo, savedLogoCacheKey]);

  const isLoading =
    groupQuery.isPending || (Boolean(groupQuery.data) && !hydrated);

  const loadError = groupQuery.isError
    ? groupQuery.error instanceof Error
      ? groupQuery.error.message
      : "Não foi possível carregar os dados do grupo."
    : null;

  return {
    values,
    meta,
    logoPreviewUrl,
    isDirty,
    isSaving,
    isLoading,
    loadError,
    hasSavedOnce,
    reload: () => {
      void groupQuery.refetch();
    },
    setField,
    setAddressField,
    patchAddress,
    setLogoFile,
    removeLogo,
    save,
    discard,
  };
}

export type CompanySettingsFormApi = ReturnType<typeof useCompanySettingsForm>;
