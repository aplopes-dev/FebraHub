import type {
  ListIndicacoesReferrersParams,
  ListIndicacoesReferredPatientsParams,
  IndicacoesPeriodParams,
} from '../services/indicacoes.api.service';

export const indicacoesKeys = {
  all: ['clinic', 'indicacoes'] as const,
  kpis: (storeId: string, params: IndicacoesPeriodParams) =>
    [...indicacoesKeys.all, 'kpis', storeId, params] as const,
  referredPatients: (
    storeId: string,
    params: ListIndicacoesReferredPatientsParams,
  ) => [...indicacoesKeys.all, 'referred-patients', storeId, params] as const,
  referrers: (storeId: string, params: ListIndicacoesReferrersParams) =>
    [...indicacoesKeys.all, 'referrers', storeId, params] as const,
};
