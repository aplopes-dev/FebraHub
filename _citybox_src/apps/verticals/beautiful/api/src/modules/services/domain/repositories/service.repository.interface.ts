import { ServiceEntity } from '../entities/service.entity';

export interface ListServicesFilter {
  search?: string;
  category?: string;
  active?: boolean;
}

export interface ListServicesPagination {
  page: number;
  perPage: number;
}

export interface PaginatedServices {
  items: ServiceEntity[];
  total: number;
}

export abstract class ServiceRepository {
  abstract save(service: ServiceEntity): Promise<void>;
  abstract findById(storeId: string, id: string): Promise<ServiceEntity | null>;
  abstract findAll(
    storeId: string,
    filter?: ListServicesFilter,
  ): Promise<ServiceEntity[]>;
  abstract findPaginated(
    storeId: string,
    filter: ListServicesFilter,
    pagination: ListServicesPagination,
  ): Promise<PaginatedServices>;
  abstract delete(storeId: string, id: string): Promise<void>;
}
