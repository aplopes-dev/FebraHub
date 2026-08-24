export type SearchHitType =
  | 'patient'
  | 'appointment'
  | 'opportunity'
  | 'stock_product';

export type SearchHitRow = {
  id: string;
  type: SearchHitType;
  title: string;
  subtitle: string | null;
  href: string;
};

export type SearchScope = {
  includePatients: boolean;
  includeAppointments: boolean;
  includeOpportunities: boolean;
  includeStock: boolean;
  /** Quando definido, restringe consultas ao profissional (agenda própria). */
  professionalIds?: string[];
  /** undefined = todos os funis; [] = nenhum funil visível (pula oportunidades). */
  visibleFunnelIds?: string[];
};

export abstract class SearchRepository {
  abstract search(
    storeId: string,
    tsq: string,
    limit: number,
    scope: SearchScope,
  ): Promise<SearchHitRow[]>;
}
