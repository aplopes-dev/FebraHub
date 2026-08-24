"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "@citybox/mui";

import { EMPTY_COMPANY_SETTINGS } from "../data/mock-company";
import {
  persistBrandColor,
  readDefaultBrandColor,
  readStoredBrandColor,
  subscribeBrandColor,
} from "../lib/brand-color-store";
import {
  toCompanySettingsForm,
  toUpdateOrganizationPayload,
} from "../api/organization-current.mapper";
import { useCurrentOrganizationQuery } from "./use-organization-current-queries";
import { useUpdateCurrentOrganizationMutation } from "./use-organization-current-mutations";
import type {
  AddressInfo,
  BillingInfo,
  CompanySettings,
  ContactInfo,
  UsageSettings,
} from "../types/company";

type ContactKey = "financeContact" | "ownerContact";

/**
 * Compara só o que a API (e a cor de marca) persistem — mudanças em campos
 * "Em breve" não deixam o rodapé dirty nem disparam PUT falso.
 */
function apiPersistSlice(values: CompanySettings) {
  return {
    legalName: values.legalName,
    tradeName: values.tradeName,
    email: values.email,
    phone: values.phone,
    ownerContact: {
      name: values.ownerContact.name,
      document: values.ownerContact.document ?? "",
      email: values.ownerContact.email,
      phone: values.ownerContact.phone,
    },
  };
}

export function useCompanySettingsForm() {
  const orgQuery = useCurrentOrganizationQuery();
  const updateMutation = useUpdateCurrentOrganizationMutation();

  const [values, setValues] = useState<CompanySettings>(EMPTY_COMPANY_SETTINGS);
  const [baseline, setBaseline] = useState<CompanySettings>(EMPTY_COMPANY_SETTINGS);
  const [hydratedFromApi, setHydratedFromApi] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const storedBrandColor = useSyncExternalStore(
    subscribeBrandColor,
    readStoredBrandColor,
    readDefaultBrandColor,
  );
  const [brandColorDraft, setBrandColorDraft] = useState<string | null>(null);
  const brandColor = brandColorDraft ?? storedBrandColor;

  // Hidrata o form quando o GET chega (ou troca de empresa).
  useEffect(() => {
    if (!orgQuery.data) return;
    const next = toCompanySettingsForm(orgQuery.data);
    setValues(next);
    setBaseline(next);
    setHydratedFromApi(true);
    setHasSavedOnce(false);
  }, [orgQuery.data]);

  const currentValues = useMemo<CompanySettings>(
    () => ({ ...values, brandColor }),
    [values, brandColor],
  );

  const isDirty = useMemo(
    () =>
      JSON.stringify(apiPersistSlice(values)) !==
        JSON.stringify(apiPersistSlice(baseline)) ||
      brandColor !== storedBrandColor,
    [values, baseline, brandColor, storedBrandColor],
  );

  const setField = useCallback(
    <Key extends keyof CompanySettings>(field: Key, value: CompanySettings[Key]) => {
      if (field === "brandColor") {
        setBrandColorDraft((value as string | undefined) ?? null);
        return;
      }
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setAddressField = useCallback(
    <Key extends keyof AddressInfo>(field: Key, value: AddressInfo[Key]) => {
      setValues((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
    },
    [],
  );

  const setContactField = useCallback(
    <Key extends keyof ContactInfo>(
      contact: ContactKey,
      field: Key,
      value: ContactInfo[Key],
    ) => {
      setValues((prev) => ({
        ...prev,
        [contact]: { ...prev[contact], [field]: value },
      }));
    },
    [],
  );

  const setBillingField = useCallback(
    <Key extends keyof BillingInfo>(field: Key, value: BillingInfo[Key]) => {
      setValues((prev) => ({ ...prev, billing: { ...prev.billing, [field]: value } }));
    },
    [],
  );

  const setBillingAddressField = useCallback(
    <Key extends keyof AddressInfo>(field: Key, value: AddressInfo[Key]) => {
      setValues((prev) => ({
        ...prev,
        billing: {
          ...prev.billing,
          address: { ...prev.billing.address, [field]: value },
        },
      }));
    },
    [],
  );

  const setUsageField = useCallback(
    <Key extends keyof UsageSettings>(field: Key, value: UsageSettings[Key]) => {
      setValues((prev) => ({ ...prev, usage: { ...prev.usage, [field]: value } }));
    },
    [],
  );

  const setCertificate = useCallback((certificate: CompanySettings["certificate"]) => {
    setValues((prev) => ({ ...prev, certificate }));
  }, []);

  const save = useCallback(async () => {
    if (!values.legalName.trim()) {
      toast.error("Razão social obrigatória");
      return;
    }
    if (!values.email.trim()) {
      toast.error("E-mail comercial obrigatório");
      return;
    }
    if (!values.ownerContact.name.trim()) {
      toast.error("Nome do responsável obrigatório");
      return;
    }

    try {
      const updated = await updateMutation.mutateAsync(
        toUpdateOrganizationPayload(values),
      );
      const next = toCompanySettingsForm(updated);
      setValues(next);
      setBaseline(next);
      if (brandColorDraft) {
        persistBrandColor(brandColorDraft);
        setBrandColorDraft(null);
      }
      setHasSavedOnce(true);
      toast.success("Configurações salvas", {
        description: "Os dados cadastrais da empresa foram atualizados.",
      });
    } catch {
      // toast de erro já tratado na mutation
    }
  }, [values, brandColorDraft, updateMutation]);

  const discard = useCallback(() => {
    setValues(baseline);
    setBrandColorDraft(null);
    toast.info("Alterações descartadas");
  }, [baseline]);

  return {
    values: currentValues,
    isDirty,
    isSaving: updateMutation.isPending,
    isLoading: orgQuery.isLoading || (!hydratedFromApi && orgQuery.isFetching),
    loadError: orgQuery.isError
      ? orgQuery.error instanceof Error
        ? orgQuery.error.message
        : "Não foi possível carregar os dados da empresa."
      : null,
    hasSavedOnce,
    reload: () => void orgQuery.refetch(),
    setField,
    setAddressField,
    setContactField,
    setBillingField,
    setBillingAddressField,
    setUsageField,
    setCertificate,
    save,
    discard,
  };
}

export type CompanySettingsFormApi = ReturnType<typeof useCompanySettingsForm>;
