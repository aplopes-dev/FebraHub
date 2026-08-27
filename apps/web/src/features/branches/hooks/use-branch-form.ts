"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  toCreateBranchPayload,
  toUpdateBranchPayload,
} from "@/features/branches/api/branch.mapper";
import {
  deleteBranchLogoApi,
  deleteMatrixLogoApi,
  uploadBranchLogoApi,
  uploadMatrixLogoApi,
} from "@/features/branches/api/branches.service";
import { unitLogoProxyUrl } from "@/features/branches/api/unit-logo-url";
import {
  useCreateBranchMutation,
  useCreateMatrixMutation,
  useUpdateBranchMutation,
  useUpdateMatrixMutation,
} from "@/features/branches/hooks/use-branch-mutations";
import {
  createEmptyBranchFormValues,
  documentLabel,
  type BranchAddress,
  type BranchFormValues,
  type UnitKind,
} from "@/features/branches/types/branch";

type UseBranchFormOptions = {
  unitKind: UnitKind;
  unitId?: string;
  matrixId?: string;
  initialValues?: BranchFormValues;
  initialHasLogo?: boolean;
  initialLogoCacheKey?: string | null;
  onSaved?: () => void;
};

export function useBranchForm({
  unitKind,
  unitId,
  matrixId,
  initialValues,
  initialHasLogo = false,
  initialLogoCacheKey = null,
  onSaved,
}: UseBranchFormOptions) {
  const initial = useMemo(
    () => initialValues ?? createEmptyBranchFormValues(),
    [initialValues],
  );
  const [values, setValues] = useState<BranchFormValues>(initial);
  const [baseline, setBaseline] = useState<BranchFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const [hasSavedLogo, setHasSavedLogo] = useState(initialHasLogo);
  const [savedLogoCacheKey, setSavedLogoCacheKey] = useState<string | null>(
    initialLogoCacheKey,
  );
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoRemove, setPendingLogoRemove] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(() =>
    initialHasLogo && unitId && initialLogoCacheKey
      ? unitLogoProxyUrl(unitKind, unitId, initialLogoCacheKey)
      : null,
  );

  useEffect(() => {
    setValues(initial);
    setBaseline(initial);
    setHasSavedLogo(initialHasLogo);
    setSavedLogoCacheKey(initialLogoCacheKey ?? null);
    setPendingLogoFile(null);
    setPendingLogoRemove(false);
    setLogoPreviewUrl(
      initialHasLogo && unitId && initialLogoCacheKey
        ? unitLogoProxyUrl(unitKind, unitId, initialLogoCacheKey)
        : null,
    );
  }, [initial, initialHasLogo, initialLogoCacheKey, unitId, unitKind]);

  const createMatrixMutation = useCreateMatrixMutation();
  const createBranchMutation = useCreateBranchMutation();
  const updateMatrixMutation = useUpdateMatrixMutation();
  const updateBranchMutation = useUpdateBranchMutation();

  const isDirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(baseline) ||
      pendingLogoFile !== null ||
      pendingLogoRemove,
    [values, baseline, pendingLogoFile, pendingLogoRemove],
  );

  const setField = useCallback(
    <Key extends keyof BranchFormValues>(
      key: Key,
      value: BranchFormValues[Key],
    ) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setAddressField = useCallback(
    <Key extends keyof BranchAddress>(key: Key, value: BranchAddress[Key]) => {
      setValues((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }));
    },
    [],
  );

  const patchAddress = useCallback((partial: Partial<BranchAddress>) => {
    setValues((prev) => ({
      ...prev,
      address: { ...prev.address, ...partial },
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

  const discard = useCallback(() => {
    setValues(baseline);
    setPendingLogoFile(null);
    setPendingLogoRemove(false);
    setLogoPreviewUrl((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return hasSavedLogo && savedLogoCacheKey && unitId
        ? unitLogoProxyUrl(unitKind, unitId, savedLogoCacheKey)
        : null;
    });
  }, [baseline, hasSavedLogo, savedLogoCacheKey, unitId, unitKind]);

  const isSaving =
    createMatrixMutation.isPending ||
    createBranchMutation.isPending ||
    updateMatrixMutation.isPending ||
    updateBranchMutation.isPending;

  const save = useCallback(async () => {
    if (!values.code.trim()) {
      toast.error("Informe o código da unidade.");
      return false;
    }

    if (!values.legalName.trim()) {
      toast.error("Informe a razão social da unidade.");
      return false;
    }

    if (!values.document.trim()) {
      toast.error(`Informe o ${documentLabel(values.personType)} da unidade.`);
      return false;
    }

    if (unitKind === "store" && !unitId && !matrixId) {
      toast.error("Empresa matriz não informada.");
      return false;
    }

    try {
      let saved =
        unitKind === "matrix"
          ? unitId
            ? await updateMatrixMutation.mutateAsync({
                id: unitId,
                payload: toUpdateBranchPayload(values),
              })
            : await createMatrixMutation.mutateAsync(
                toCreateBranchPayload(values),
              )
          : unitId
            ? await updateBranchMutation.mutateAsync({
                id: unitId,
                payload: toUpdateBranchPayload(values),
              })
            : await createBranchMutation.mutateAsync(
                toCreateBranchPayload(values, { matrixId }),
              );

      if (pendingLogoRemove && !pendingLogoFile) {
        saved =
          unitKind === "matrix"
            ? await deleteMatrixLogoApi(saved.id)
            : await deleteBranchLogoApi(saved.id);
      }
      if (pendingLogoFile) {
        saved =
          unitKind === "matrix"
            ? await uploadMatrixLogoApi(saved.id, pendingLogoFile)
            : await uploadBranchLogoApi(saved.id, pendingLogoFile);
      }

      const nextValues = { ...values };
      setValues(nextValues);
      setBaseline(nextValues);
      setHasSavedLogo(Boolean(saved.hasLogo));
      setSavedLogoCacheKey(saved.updatedAt);
      setPendingLogoFile(null);
      setPendingLogoRemove(false);
      setLogoPreviewUrl(
        saved.hasLogo
          ? unitLogoProxyUrl(unitKind, saved.id, saved.updatedAt)
          : null,
      );
      setHasSavedOnce(true);
      onSaved?.();
      return true;
    } catch {
      return false;
    }
  }, [
    unitKind,
    unitId,
    matrixId,
    values,
    pendingLogoFile,
    pendingLogoRemove,
    onSaved,
    createMatrixMutation,
    createBranchMutation,
    updateMatrixMutation,
    updateBranchMutation,
  ]);

  return {
    values,
    setField,
    setAddressField,
    patchAddress,
    logoPreviewUrl,
    setLogoFile,
    removeLogo,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving,
    isEditing: Boolean(unitId),
  };
}

export type BranchFormApi = ReturnType<typeof useBranchForm>;
