import type {
  DealEntity,
  DealStage,
  DealStatus,
  DealType,
} from '../entities/deal.entity';

export type ListDealsFilters = {
  page: number;
  perPage: number;
  search?: string;
  leadId?: string;
  propertyId?: string;
  status?: DealStatus[];
  stage?: DealStage[];
  agentId?: string;
};

export type ListDealsResult = {
  items: DealEntity[];
  total: number;
};

export type CreateDealPayload = {
  storeId: string;
  leadId: string;
  propertyId?: string | null;
  propertyName?: string;
  leadName?: string | null;
  type?: DealType | null;
  status?: DealStatus;
  stage?: DealStage;
  title?: string;
  agentId?: string | null;
};

export type UpdateDealPayload = {
  propertyId?: string | null;
  propertyName?: string;
  leadName?: string | null;
  type?: DealType | null;
  status?: DealStatus;
  stage?: DealStage;
  title?: string;
  agentId?: string | null;
};

export type UpdateDealStagePayload = {
  stage: DealStage;
  status?: DealStatus;
};

export abstract class DealRepository {
  abstract findMany(
    storeId: string,
    filters: ListDealsFilters,
  ): Promise<ListDealsResult>;

  abstract findById(storeId: string, id: string): Promise<DealEntity | null>;

  abstract findActiveByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null>;

  /** Negócio ativo ou, se ganho, o mais recente — para barra de progresso na ficha. */
  abstract findPipelineDealByLeadId(
    storeId: string,
    leadId: string,
  ): Promise<DealEntity | null>;

  abstract create(payload: CreateDealPayload): Promise<DealEntity>;

  abstract update(
    storeId: string,
    id: string,
    payload: UpdateDealPayload,
  ): Promise<DealEntity | null>;

  abstract updateStage(
    storeId: string,
    id: string,
    payload: UpdateDealStagePayload,
  ): Promise<DealEntity | null>;

  abstract delete(storeId: string, id: string): Promise<boolean>;
}
