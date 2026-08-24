export type SearchHitType = 'lead' | 'property' | 'appointment' | 'transaction';

export type SearchHitRow = {
  id: string;
  type: SearchHitType;
  title: string;
  subtitle: string | null;
  href: string;
};

export abstract class SearchRepository {
  abstract search(
    storeId: string,
    tsq: string,
    limit: number,
    agentId?: string,
  ): Promise<SearchHitRow[]>;
}
