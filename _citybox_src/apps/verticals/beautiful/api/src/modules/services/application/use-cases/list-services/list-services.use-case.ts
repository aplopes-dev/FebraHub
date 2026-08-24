import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import {
  ListServicesFilter,
  ServiceRepository,
} from '../../../domain/repositories/service.repository.interface';

export interface ListServicesInput extends ListServicesFilter {
  storeId: string;
  page?: number;
  perPage?: number;
}

export type ServiceListStats = {
  totalServices: number;
  activeCount: number;
  inactiveCount: number;
  averagePrice: number;
  averageDuration: number;
};

export type ListServicesResult = {
  items: ServiceEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: ServiceListStats;
};

function computeStats(services: ServiceEntity[]): ServiceListStats {
  const totalServices = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = totalServices - activeCount;
  const averagePrice =
    totalServices > 0
      ? services.reduce((acc, s) => acc + s.price, 0) / totalServices
      : 0;
  const averageDuration =
    totalServices > 0
      ? Math.round(
          services.reduce((acc, s) => acc + s.durationMinutes, 0) /
            totalServices,
        )
      : 0;

  return {
    totalServices,
    activeCount,
    inactiveCount,
    averagePrice,
    averageDuration,
  };
}

@Injectable()
export class ListServicesUseCase implements IUseCase<
  ListServicesInput,
  ListServicesResult
> {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: ListServicesInput): Promise<ListServicesResult> {
    const page = Math.max(1, input.page ?? 1);
    const perPage = Math.min(100, Math.max(1, input.perPage ?? 10));
    const filter: ListServicesFilter = {
      search: input.search,
      category: input.category,
      active: input.active,
    };

    const [{ items, total }, allServices] = await Promise.all([
      this.serviceRepository.findPaginated(input.storeId, filter, {
        page,
        perPage,
      }),
      this.serviceRepository.findAll(input.storeId),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
      stats: computeStats(allServices),
    };
  }
}
