"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@citybox/ui/atoms";
import { CampaignReviewSection } from "./components/campaign-review-section";
import { CampaignStatusSection } from "./components/campaign-status-section";
import {
  pageStrategyStepFourSchema,
  type PageStrategyStepFourFormData,
} from "./page-template-step-four.schema";
import type { SelectedCampaignType } from "@/features/clinic/marketing/campaigns/types";
import type { PageStrategyFormData } from "../step-two/page-template-step-two.schema";
import type { PageStrategyStepThreeFormData } from "../step-three/page-template-step-three.schema";

type PageTemplateStepFourProps = {
  selectedType?: SelectedCampaignType;
  pageStrategyData?: Partial<PageStrategyFormData>;
  pageStrategyStepThreeData?: Partial<PageStrategyStepThreeFormData>;
  initialData?: Partial<PageStrategyStepFourFormData>;
  onDataChange?: (data: Partial<PageStrategyStepFourFormData>) => void;
  onValidationChange?: (isValid: boolean) => void;
};

export function PageTemplateStepFour({
  pageStrategyData,
  pageStrategyStepThreeData,
  initialData,
  onDataChange,
  onValidationChange,
}: PageTemplateStepFourProps) {
  const prevDataRef = useRef<Partial<PageStrategyStepFourFormData> | undefined>(
    undefined,
  );

  const form = useForm<PageStrategyStepFourFormData>({
    resolver: zodResolver(pageStrategyStepFourSchema),
    defaultValues: {
      statusType: (initialData?.statusType || "always_active") as
        | "always_active"
        | "period"
        | "limit",
      endDate: initialData?.endDate,
      leadLimit: initialData?.leadLimit,
    },
    values: initialData?.statusType
      ? {
          statusType: initialData.statusType as
            | "always_active"
            | "period"
            | "limit",
          endDate: initialData.endDate,
          leadLimit: initialData.leadLimit,
        }
      : undefined,
  });

  // Notificar mudanças nos dados
  useEffect(() => {
    if (!onDataChange) return;

    // Notificar dados iniciais imediatamente após o formulário ser inicializado
    const notifyInitialData = () => {
      const formData = form.getValues();
      // Garantir que statusType sempre tenha um valor válido
      const statusType = (formData.statusType || "always_active") as
        | "always_active"
        | "period"
        | "limit";

      // Se não tiver statusType, definir o padrão
      if (!formData.statusType) {
        form.setValue("statusType", statusType, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }

      const dataToNotify: Partial<PageStrategyStepFourFormData> = {
        statusType,
        endDate: formData.endDate,
        leadLimit: formData.leadLimit,
      };

      prevDataRef.current = dataToNotify;
      onDataChange(dataToNotify);
    };

    // Aguardar um tick para garantir que o formulário está inicializado
    const timeoutId = setTimeout(notifyInitialData, 0);

    const subscription = form.watch((data) => {
      const statusType = (data.statusType || "always_active") as
        | "always_active"
        | "period"
        | "limit";
      const currentData: Partial<PageStrategyStepFourFormData> = {
        statusType,
        endDate: data.endDate,
        leadLimit: data.leadLimit,
      };

      // Comparar apenas os campos relevantes
      const prevStr = JSON.stringify(prevDataRef.current);
      const currentStr = JSON.stringify(currentData);

      if (prevStr !== currentStr) {
        prevDataRef.current = currentData;
        onDataChange(currentData);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [form, onDataChange]);

  // Notificar mudanças na validação
  useEffect(() => {
    if (!onValidationChange) return;

    const subscription = form.watch(() => {
      form.trigger().then((isValid) => {
        onValidationChange(isValid);
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onValidationChange]);

  // Validar inicialmente
  useEffect(() => {
    if (onValidationChange) {
      form.trigger().then((isValid) => {
        onValidationChange(isValid);
      });
    }
  }, [form, onValidationChange]);

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Configurações */}
        <div className="space-y-6">
          <CampaignStatusSection form={form} />
        </div>
        {/* Coluna Direita - Revisão */}
        <div className="space-y-6">
          <CampaignReviewSection
            pageStrategyData={pageStrategyData}
            pageStrategyStepThreeData={pageStrategyStepThreeData}
          />
        </div>
      </div>
    </Form>
  );
}
