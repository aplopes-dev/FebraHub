"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { getCostCenterAnalysisApi } from "@/features/cost-center-analysis/api/cost-center-analysis.service";
import { costCenterAnalysisKeys } from "@/features/cost-center-analysis/hooks/query-keys";
import {
  createDefaultFinancialResultPeriod,
  resolveFinancialResultPeriodRange,
  toIsoDateString,
} from "@/features/financial-results/lib/financial-result-period";
import type {
  FinancialResultPeriod,
  FinancialResultPeriodPreset,
} from "@/features/financial-results/types/financial-result";
import type { CostCenterAnalysisType } from "@/features/cost-center-analysis/types/cost-center-analysis";

type CustomRange = {
  from: string | null;
  to: string | null;
};

/** Reaproveita a lógica de período de `financial-results` — mesmos presets. */
export function useCostCenterAnalysis() {
  const { scope, ready } = useCatalogScope();
  const [period, setPeriod] = useState<FinancialResultPeriod>(
    createDefaultFinancialResultPeriod,
  );
  const [type, setType] = useState<CostCenterAnalysisType>("despesa");

  const range = useMemo(
    () => resolveFinancialResultPeriodRange(period),
    [period],
  );
  const from = range ? toIsoDateString(range.from) : null;
  const to = range ? toIsoDateString(range.to) : null;

  const query = useQuery({
    queryKey: costCenterAnalysisKeys.report(scope, from ?? "", to ?? "", type),
    queryFn: () => getCostCenterAnalysisApi(from!, to!, type),
    enabled: ready && from != null && to != null,
  });

  const report = range ? (query.data ?? null) : null;

  function setPreset(preset: FinancialResultPeriodPreset) {
    setPeriod((current) =>
      preset === "custom"
        ? { ...current, preset }
        : { preset, customFrom: null, customTo: null },
    );
  }

  function setCustomRange(customRange: CustomRange) {
    setPeriod({
      preset: "custom",
      customFrom: customRange.from,
      customTo: customRange.to,
    });
  }

  return {
    period,
    setPreset,
    setCustomRange,
    type,
    setType,
    report,
    isLoading: range != null && query.isLoading,
    isError: range != null && query.isError,
    refetch: query.refetch,
  };
}
