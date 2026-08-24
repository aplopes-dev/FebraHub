"use client";

import { useCallback, useMemo, useState } from "react";
import { createEmptyPromotionFormValues } from "@/features/promotions/lib/promotion-form-values";
import type {
  PromotionFormValues,
  PromotionGeneralConfig,
  PromotionRules,
  PromotionStep,
} from "@/features/promotions/types/promotion-form";
import { PROMOTION_STEP_ORDER } from "@/features/promotions/types/promotion-form";
import type { PromotionType } from "@/features/promotions/types/promotion";

type StepValidation = {
  valid: boolean;
  message?: string;
};

export function usePromotionCreateForm(initialValues?: PromotionFormValues) {
  const [values, setValues] = useState<PromotionFormValues>(
    () => initialValues ?? createEmptyPromotionFormValues(),
  );
  const [stepIndex, setStepIndex] = useState(0);

  const step = PROMOTION_STEP_ORDER[stepIndex] as PromotionStep;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === PROMOTION_STEP_ORDER.length - 1;

  const setType = useCallback((type: PromotionType) => {
    setValues((prev) => ({ ...prev, type }));
  }, []);

  const setGeneralField = useCallback(
    <K extends keyof PromotionGeneralConfig>(
      key: K,
      value: PromotionGeneralConfig[K],
    ) => {
      setValues((prev) => ({
        ...prev,
        general: { ...prev.general, [key]: value },
      }));
    },
    [],
  );

  const setRulesField = useCallback(
    <K extends keyof PromotionRules>(key: K, value: PromotionRules[K]) => {
      setValues((prev) => ({
        ...prev,
        rules: { ...prev.rules, [key]: value },
      }));
    },
    [],
  );

  const validateStep = useCallback(
    (target: PromotionStep): StepValidation => {
      if (target === "type") {
        return values.type
          ? { valid: true }
          : { valid: false, message: "Selecione um tipo de promoção." };
      }

      if (target === "general") {
        if (!values.general.name.trim()) {
          return { valid: false, message: "Informe o nome da promoção." };
        }
        if (!values.general.startDate || !values.general.endDate) {
          return {
            valid: false,
            message: "Defina as datas de início e término.",
          };
        }
        if (
          values.general.restrictionMode === "specific_weekdays" &&
          values.general.weekdays.length === 0
        ) {
          return {
            valid: false,
            message: "Selecione ao menos um dia da semana.",
          };
        }
        return { valid: true };
      }

      return { valid: true };
    },
    [values],
  );

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback((): StepValidation => {
    const result = validateStep(step);
    if (!result.valid) return result;
    setStepIndex((prev) =>
      Math.min(PROMOTION_STEP_ORDER.length - 1, prev + 1),
    );
    return { valid: true };
  }, [step, validateStep]);

  const buildIso = useCallback((date: string, time: string): string => {
    if (!date) return "";
    return `${date}T${time || "00:00"}:00`;
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return value;
}

export type PromotionCreateForm = ReturnType<typeof usePromotionCreateForm>;
