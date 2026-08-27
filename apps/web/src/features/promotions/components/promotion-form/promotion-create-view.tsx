"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ScrollArea, toast } from "@/ui";
import { ProductFormHeader } from "@/features/products/components/product-form-header";
import { PromotionStepper } from "@/features/promotions/components/promotion-form/promotion-stepper";
import { PromotionFormFooter } from "@/features/promotions/components/promotion-form/promotion-form-footer";
import { PromotionTypeStep } from "@/features/promotions/components/promotion-form/steps/promotion-type-step";
import { PromotionGeneralStep } from "@/features/promotions/components/promotion-form/steps/promotion-general-step";
import { PromotionRulesStep } from "@/features/promotions/components/promotion-form/steps/promotion-rules-step";
import { usePromotionCreateForm } from "@/features/promotions/hooks/use-promotion-create-form";
import { usePromotionMutations } from "@/features/promotions/hooks/use-promotion-queries";
import type { PromotionFormValues } from "@/features/promotions/types/promotion-form";

type PromotionCreateViewProps = {
  /** Quando presente, o formulário edita a promoção com este id. */
  promotionId?: string;
  initialValues?: PromotionFormValues;
};

export function PromotionCreateView({
  promotionId,
  initialValues,
}: PromotionCreateViewProps = {}) {
  const router = useRouter();
  const isEdit = promotionId != null;
  const mutations = usePromotionMutations();
  const {
    values,
    step,
    stepIndex,
    isFirstStep,
    isLastStep,
    setType,
    setGeneralField,
    setRulesField,
    validateStep,
    goToStep,
    goBack,
    goNext,
    buildIso,
  } = usePromotionCreateForm(initialValues);

  const canAdvance = validateStep(step).valid;
  const isSaving = mutations.create.isPending || mutations.update.isPending;

  function handleNext() {
    const result = goNext();
    if (!result.valid && result.message) {
      toast.error(result.message);
    }
  }

  function handleSave() {
    const typeCheck = validateStep("type");
    if (!typeCheck.valid) {
      goToStep(0);
      toast.error(typeCheck.message ?? "Selecione um tipo de promoção.");
      return;
    }

    const generalCheck = validateStep("general");
    if (!generalCheck.valid) {
      goToStep(1);
      toast.error(generalCheck.message ?? "Revise as informações gerais.");
      return;
    }

    if (!values.type || isSaving) return;

    const payload = {
      name: values.general.name.trim(),
      type: values.type,
      startsAt: buildIso(values.general.startDate, values.general.startTime),
      endsAt: buildIso(values.general.endDate, values.general.endTime),
      description: values.general.description.trim() || undefined,
      branchIds: values.general.unitIds,
      rulesJson: {
        ...values.rules,
        restrictionMode: values.general.restrictionMode,
        weekdays: values.general.weekdays,
      } as Record<string, unknown>,
    };

    const onSuccess = () => {
      router.push("/vendas/promocoes");
    };

    if (isEdit && promotionId) {
      mutations.update.mutate({ id: promotionId, ...payload }, { onSuccess });
    } else {
      mutations.create.mutate(payload, { onSuccess });
    }
  }

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={3} sx={{ px: 3, pt: 3, pb: 2 }}>
          <ProductFormHeader
            title={isEdit ? "Editar promoção" : "Nova promoção"}
            subtitle="Promoção"
            backHref="/vendas/promocoes"
          />

          <PromotionStepper currentIndex={stepIndex} onStepClick={goToStep} />

          {step === "type" ? (
            <PromotionTypeStep
              value={values.type}
              onChange={setType}
              typeLocked={isEdit}
            />
          ) : null}

          {step === "general" ? (
            <PromotionGeneralStep
              values={values.general}
              onFieldChange={setGeneralField}
            />
          ) : null}

          {step === "rules" && values.type ? (
            <PromotionRulesStep
              type={values.type}
              rules={values.rules}
              onRulesChange={setRulesField}
            />
          ) : null}
        </Stack>
      </ScrollArea>

      <PromotionFormFooter
        selectedType={values.type}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        canAdvance={canAdvance && !isSaving}
        saveLabel={isEdit ? "Salvar alterações" : "Salvar promoção"}
        onBack={goBack}
        onNext={handleNext}
        onSave={handleSave}
      />
    </Box>
  );
}
