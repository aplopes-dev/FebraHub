"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@citybox/ui/atoms";
import { ModalFormTabs } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import { mapFormToUpdateStorePayload } from "../lib/map-form-to-store-payload";
import { mapStoreToFormData } from "../lib/map-store-to-form-data";
import { useUpdateStoreMutation } from "../hooks/use-store-mutations";
import { useStoreDetailQuery } from "../hooks/use-store-detail-query";
import {
  newStoreSchema,
  EDIT_STORE_DEFAULT_VALUES,
  type NewStoreFormData,
} from "../schemas/new-store-schema";
import type { Loja } from "../types";
import { NewStoreStepIdentity } from "./new-store-step-identity";
import { NewStoreStepFiscal } from "./new-store-step-fiscal";
import { NewStoreStepLocation } from "./new-store-step-location";

const TAB_IDENTIDADE = "identidade";
const TAB_FISCAL = "fiscal";
const TAB_LOCALIZACAO = "localizacao";

const TAB_FIELD_GROUPS: Record<string, (keyof NewStoreFormData)[]> = {
  [TAB_IDENTIDADE]: ["vertical", "tradeName", "slug"],
  [TAB_FISCAL]: [
    "personType",
    "document",
    "legalName",
    "stateRegistration",
    "responsibleName",
    "billingEmail",
  ],
  [TAB_LOCALIZACAO]: [
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "estado",
    "telefone",
    "timezone",
  ],
};

function getFirstTabWithError(errors: FieldErrors<NewStoreFormData>): string | null {
  for (const [tab, fields] of Object.entries(TAB_FIELD_GROUPS)) {
    if (fields.some((field) => errors[field])) {
      return tab;
    }
  }
  return null;
}

interface EditStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loja: Loja | null;
}

export function EditStoreDialog({ open, onOpenChange, loja }: EditStoreDialogProps) {
  const [activeTab, setActiveTab] = useState(TAB_IDENTIDADE);
  const updateMutation = useUpdateStoreMutation();
  const {
    detail: storeDetail,
    isPending: isLoadingDetail,
    error: detailError,
  } = useStoreDetailQuery(loja?.id ?? "", {
    enabled: open && Boolean(loja?.id),
  });

  const form = useForm<NewStoreFormData>({
    resolver: zodResolver(newStoreSchema),
    defaultValues: EDIT_STORE_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && storeDetail) {
      form.reset(mapStoreToFormData(storeDetail));
      setActiveTab(TAB_IDENTIDADE);
    }
  }, [open, storeDetail, form]);

  const tabs = useMemo(
    () => [
      {
        value: TAB_IDENTIDADE,
        label: "Identidade",
        title: "Identidade",
        subtitle: "Nome fantasia e slug da loja. A vertical é imutável após a criação.",
        content: (
          <NewStoreStepIdentity
            control={form.control}
            register={form.register}
            errors={form.formState.errors}
            isEditing
            clinicStrand={storeDetail?.clinicStrand}
          />
        ),
      },
      {
        value: TAB_FISCAL,
        label: "Dados Fiscais",
        title: "Dados Fiscais",
        subtitle: "Documento, responsável e e-mail de cobrança da loja.",
        content: (
          <NewStoreStepFiscal
            control={form.control}
            register={form.register}
            watch={form.watch}
            errors={form.formState.errors}
          />
        ),
      },
      {
        value: TAB_LOCALIZACAO,
        label: "Localização",
        title: "Localização e Operação",
        subtitle: "Endereço físico, telefone e fuso horário da loja.",
        content: (
          <>
            {form.formState.errors.root?.message ? (
              <p className="mb-4 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <NewStoreStepLocation
              control={form.control}
              register={form.register}
              setValue={form.setValue}
              setError={form.setError}
              clearErrors={form.clearErrors}
              errors={form.formState.errors}
              cepLookupResetToken={loja?.id}
            />
          </>
        ),
      },
    ],
    [
      form.control,
      form.register,
      form.watch,
      form.formState.errors,
      form.setValue,
      form.setError,
      form.clearErrors,
      loja?.id,
    ],
  );

  const isFormReady = Boolean(storeDetail) && !isLoadingDetail;

  const handleSave = form.handleSubmit(
    async (data) => {
      if (!loja) return;
      try {
        await updateMutation.mutateAsync({
          id: loja.id,
          payload: mapFormToUpdateStorePayload(data),
        });
        onOpenChange(false);
      } catch (err) {
        form.setError("root", { message: extractApiMessage(err) });
      }
    },
    (errors) => {
      const tabWithError = getFirstTabWithError(errors);
      if (tabWithError) {
        setActiveTab(tabWithError);
      }
    },
  );

  const dialogTabs = useMemo(() => {
    if (isLoadingDetail) {
      return [
        {
          value: "loading",
          label: "Carregando",
          title: "Carregando loja",
          subtitle: "Buscando dados completos do cadastro.",
          content: (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando informações...
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ),
        },
      ];
    }

    if (detailError) {
      return [
        {
          value: "error",
          label: "Erro",
          title: "Não foi possível carregar a loja",
          subtitle: extractApiMessage(detailError),
          content: (
            <p className="text-sm text-destructive">{extractApiMessage(detailError)}</p>
          ),
        },
      ];
    }

    return tabs;
  }, [detailError, isLoadingDetail, tabs]);

  return (
    <ModalFormTabs
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Loja"
      activeTab={isFormReady ? activeTab : (dialogTabs[0]?.value ?? TAB_IDENTIDADE)}
      onActiveTabChange={isFormReady ? setActiveTab : undefined}
      defaultTab={TAB_IDENTIDADE}
      tabs={dialogTabs}
      onClose={() => {
        form.reset(EDIT_STORE_DEFAULT_VALUES);
        setActiveTab(TAB_IDENTIDADE);
      }}
      onSave={handleSave}
      isSaving={updateMutation.isPending || isLoadingDetail || !isFormReady}
    />
  );
}
