'use client';

import { useState } from 'react';
import { IndicacoesKpiCards } from '../components/indicacoes-kpi-cards';
import {
  DEFAULT_INDICACOES_MONTH,
  DEFAULT_INDICACOES_YEAR,
} from '../components/indicacoes-period-filters';
import { IndicacoesReferredPatientsSection } from '../components/indicacoes-referred-patients-section';
import { IndicacoesReferrersSection } from '../components/indicacoes-referrers-section';
import { useIndicacoesKpisQuery } from '../hooks/use-indicacoes-kpis-query';
import type { IndicacoesPeriodMode } from '../types/indicacoes';

export function IndicacoesPage() {
  const [referredMode, setReferredMode] =
    useState<IndicacoesPeriodMode>('monthly');
  const [referredMonth, setReferredMonth] = useState(DEFAULT_INDICACOES_MONTH);
  const [referredYear, setReferredYear] = useState(DEFAULT_INDICACOES_YEAR);

  const [referrerMode, setReferrerMode] =
    useState<IndicacoesPeriodMode>('monthly');
  const [referrerMonth, setReferrerMonth] = useState(DEFAULT_INDICACOES_MONTH);
  const [referrerYear, setReferrerYear] = useState(DEFAULT_INDICACOES_YEAR);

  const kpisQuery = useIndicacoesKpisQuery({
    periodMode: referredMode,
    year: referredYear,
    month: referredMode === 'monthly' ? referredMonth : undefined,
  });

  const years =
    kpisQuery.data?.years?.length
      ? kpisQuery.data.years
      : [DEFAULT_INDICACOES_YEAR - 1, DEFAULT_INDICACOES_YEAR];

  const kpis = kpisQuery.data ?? {
    totalReferrals: 0,
    approvedBudgetsValueCents: 0,
    withoutScheduledAppointment: 0,
    years,
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Gerenciador de Indicações de Pacientes
      </h1>

      {kpisQuery.isError ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar os indicadores.
        </p>
      ) : (
        <IndicacoesKpiCards kpis={kpis} />
      )}

      <IndicacoesReferredPatientsSection
        mode={referredMode}
        year={referredYear}
        month={referredMonth}
        years={years}
        onModeChange={setReferredMode}
        onMonthChange={setReferredMonth}
        onYearChange={setReferredYear}
      />

      <IndicacoesReferrersSection
        mode={referrerMode}
        year={referrerYear}
        month={referrerMonth}
        years={years}
        onModeChange={setReferrerMode}
        onMonthChange={setReferrerMonth}
        onYearChange={setReferrerYear}
      />
    </div>
  );
}
