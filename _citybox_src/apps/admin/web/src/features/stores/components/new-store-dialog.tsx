"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalFormMultistep } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import {
  newStoreSchema,
  NEW_STORE_DEFAULT_VALUES,
  type NewStoreFormData,
} from "../schemas/new-store-schema";
import { NewStoreStepIdentity } from "./new-store-step-identity";
import { NewStoreStepPlan } from "./new-store-step-plan";
import { NewStoreStepFiscal } from "./new-store-step-fiscal";
import { NewStoreStepLocation } from "./new-store-step-location";

interface NewStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewStoreFormData) => Promise<void>;
  isSaving?: boolean;
}

export function NewStoreDialog({
  open,
  onOpenChange,
  onSubmit,
  isSaving,
}: NewStoreDialogProps) {
  const form = useForm<NewStoreFormData>({
    resolver: zodResolver(newStoreSchema),
    defaultValues: NEW_STORE_DEFAULT_VALUES,
  });

  return (
    <ModalFormMultistep
      open={open}
      onOpenChange={onOpenChange}
      sidebarTitle="Nova Loja"
      sidebarSubtitle="Preencha as informações"
      isSaving={isSaving}
      steps={[
        {
          label: "Identidade",
          description: "Vertical, nome e slug",
          title: "Identidade",
          subtitle: "Defina a vertical de negócio, o nome fantasia e o slug da loja.",
          content: (
            <NewStoreStepIdentity
              control={form.control}
              register={form.register}
              errors={form.formState.errors}
            />
          ),
        },
        {
          label: "Plano",
          description: "Cobrança e recorrência",
          title: "Plano e Cobrança",
          subtitle: "Escolha o plano (filtrado pela vertical) e a recorrência de cobrança.",
          content: (
            <NewStoreStepPlan control={form.control} setValue={form.setValue} />
          ),
        },
        {
          label: "Dados Fiscais",
          description: "Documento e responsável",
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
          label: "Localização",
          description: "Endereço e contato",
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
              />
            </>
          ),
        },
      ]}
      onBeforeNext={async (stepIndex) => {
        if (stepIndex === 0) {
          return form.trigger(["vertical", "tradeName", "slug"]);
        }
        if (stepIndex === 1) {
          return form.trigger(["planId", "billingCycle", "dueDay"]);
        }
        if (stepIndex === 2) {
          return form.trigger([
            "personType",
            "document",
            "responsibleName",
            "billingEmail",
          ]);
        }
        if (stepIndex === 3) {
          return form.trigger(["timezone"]);
        }
        return true;
      }}
      onClose={() => form.reset(NEW_STORE_DEFAULT_VALUES)}
      onSave={form.handleSubmit(async (data) => {
        try {
          await onSubmit(data);
          form.reset(NEW_STORE_DEFAULT_VALUES);
          onOpenChange(false);
        } catch (err) {
          form.setError("root", { message: extractApiMessage(err) });
        }
      })}
    />
  );
}
