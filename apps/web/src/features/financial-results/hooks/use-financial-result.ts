"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { getIncomeStatementApi } from "@/features/financial-results/api/financial-results.service";
import { financialResultKeys } from "@/features/financial-results/hooks/query-keys";
import {
  createDefaultFinancialResultPeriod,
  resolveFinancialResultPeriodRange,
  toIsoDateString,
} from "@/features/financial-results/lib/financial-result-period";
import type {
  FinancialResultPeriod,
  FinancialResultPeriodPreset,
} from "@/features/financial-results/types/financial-result";

type CustomRange = {
  from: string | null;
  to: string | null;
};

export function useFinancialResult() {
  const { scope, ready } = useCatalogScope();
  const [period, setPeriod] = useState<FinancialResultPeriod>(
    createDefaultFinancialResultPeriod,
  );
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    new Set(),
  );

  const range = useMemo(
    () => resolveFinancialResultPeriodRange(period),
    [period],
  );
  const from = range ? toIsoDateString(range.from) : null;
  const to = range ? toIsoDateString(range.to) : null;

  const query = useQuery({
    queryKey: financialResultKeys.report(scope, from ?? "", to ?? ""),
    queryFn: () => getIncomeStatementApi(from!, to!),
    enabled: ready && from != null && to != null,
  });

  // `report` continua `null` até o período estar resolvido — mesma semântica
  // que a tela já tratava como "selecione o período" antes desta feature.
  const report = range ? (query.data ?? null) : null;

  // Grupos nascem abertos: o estado guarda apenas quem o usuário recolheu.
  const expandedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    if (!report) return ids;
    for (const group of report.groups) {
      if (!collapsedGroupIds.has(group.groupId)) ids.add(group.groupId);
    }
    return ids;
  }, [report, collapsedGroupIds]);

  function setPreset(preset: FinancialResultPeriodPreset) {
    setPeriod((current) =>
      preset === "custom"
        ? { ...current, preset }
        : { preset, customFrom: null, customTo: null },
    );
  }

  function setCustomRange(range: CustomRange) {
    setPeriod({
      preset: "custom",
      customFrom: range.from,
      customTo: range.to,
    });
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  return {
    period,
    setPreset,
    setCustomRange,
    report,
    expandedGroupIds,
    toggleGroup,
    isLoading: range != null && query.isLoading,
    isError: range != null && query.isError,
    refetch: query.refetch,
  };
}
