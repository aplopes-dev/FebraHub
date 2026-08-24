'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/features/clinic/modules/patients/hooks/use-debounced-value';
import { resolveCommissionPeriodDates } from '../lib/filter-commissions-by-period';
import type { CommissionPeriodFilter } from '../types/commission-financial.types';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

export type CommissionProfessionalSuggestion = {
  id: string;
  name: string;
};

type UseCommissionFiltersOptions = {
  /** Sugestões de profissionais (ex.: membros do team). */
  professionals?: CommissionProfessionalSuggestion[];
};

/**
 * Estado de filtros da tela de Comissões.
 * Datas / professionalId / search vão para a API (§8.1) — sem filtragem client-side da lista.
 */
export function useCommissionFilters(options: UseCommissionFiltersOptions = {}) {
  const professionals = options.professionals ?? [];

  const [period, setPeriod] = useState<CommissionPeriodFilter>('this_month');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);

  const [professionalSearch, setProfessionalSearch] = useState('');
  const debouncedSearch = useDebouncedValue(professionalSearch, SEARCH_DEBOUNCE_MS);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(
    null,
  );
  const [selectedProfessionalName, setSelectedProfessionalName] = useState('');

  const periodRange = useMemo(
    () => resolveCommissionPeriodDates(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const professionalSuggestions = useMemo(() => {
    if (debouncedSearch.trim().length < MIN_SEARCH_LENGTH) return [];
    const lower = debouncedSearch.toLowerCase();
    return professionals.filter((p) => p.name.toLowerCase().includes(lower));
  }, [debouncedSearch, professionals]);

  /** Texto de busca para a API quando não há profissional selecionado. */
  const searchForApi = useMemo(() => {
    if (selectedProfessionalId) return undefined;
    const trimmed = debouncedSearch.trim();
    return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined;
  }, [debouncedSearch, selectedProfessionalId]);

  const handlePeriodChange = useCallback((next: CommissionPeriodFilter) => {
    setPeriod(next);
    if (next !== 'custom') {
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setProfessionalSearch(value);
      if (selectedProfessionalId) {
        setSelectedProfessionalId(null);
        setSelectedProfessionalName('');
      }
    },
    [selectedProfessionalId],
  );

  const handleSelectProfessional = useCallback((id: string, name: string) => {
    setSelectedProfessionalId(id);
    setSelectedProfessionalName(name);
    setProfessionalSearch('');
  }, []);

  const handleClearProfessional = useCallback(() => {
    setSelectedProfessionalId(null);
    setSelectedProfessionalName('');
    setProfessionalSearch('');
  }, []);

  return {
    period,
    customStart,
    customEnd,
    periodRange,
    professionalSearch,
    debouncedSearch,
    searchForApi,
    selectedProfessionalId,
    selectedProfessionalName,
    professionalSuggestions,
    handlePeriodChange,
    handleSearchChange,
    handleSelectProfessional,
    handleClearProfessional,
    handleCustomStartChange: setCustomStart,
    handleCustomEndChange: setCustomEnd,
  };
}
