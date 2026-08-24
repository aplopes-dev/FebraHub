import type {
  IndicacoesKpis,
  IndicacoesPeriodCriteria,
  IndicacoesReferrerRow,
  IndicacoesReferredPatientRow,
  ListIndicacoesReferrersCriteria,
  ListIndicacoesReferredPatientsCriteria,
  PaginatedIndicacoesResult,
} from '../indicacoes.types';

export abstract class IndicacoesRepository {
  abstract getKpis(
    storeId: string,
    criteria: IndicacoesPeriodCriteria,
  ): Promise<Omit<IndicacoesKpis, 'years'>>;

  abstract listYears(storeId: string): Promise<number[]>;

  abstract listReferredPatients(
    storeId: string,
    criteria: ListIndicacoesReferredPatientsCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferredPatientRow>>;

  abstract listReferrers(
    storeId: string,
    criteria: ListIndicacoesReferrersCriteria,
  ): Promise<PaginatedIndicacoesResult<IndicacoesReferrerRow>>;
}
