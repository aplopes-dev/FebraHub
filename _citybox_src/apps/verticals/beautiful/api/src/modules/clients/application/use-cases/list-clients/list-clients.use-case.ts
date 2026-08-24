import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClientEntity } from '../../../domain/entities/client.entity';
import {
  ListClientsFilter,
  ClientRepository,
} from '../../../domain/repositories/client.repository.interface';

export interface ListClientsInput extends ListClientsFilter {
  storeId: string;
  page?: number;
  perPage?: number;
}

export type ClientListStats = {
  totalClients: number;
  withCategoryCount: number;
  withoutCategoryCount: number;
};

export type ListClientsResult = {
  items: ClientEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: ClientListStats;
};

function computeStats(clients: ClientEntity[]): ClientListStats {
  const totalClients = clients.length;
  const withCategoryCount = clients.filter((c) => Boolean(c.categoryId)).length;
  const withoutCategoryCount = totalClients - withCategoryCount;

  return {
    totalClients,
    withCategoryCount,
    withoutCategoryCount,
  };
}

@Injectable()
export class ListClientsUseCase implements IUseCase<
  ListClientsInput,
  ListClientsResult
> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(input: ListClientsInput): Promise<ListClientsResult> {
    const page = Math.max(1, input.page ?? 1);
    const perPage = Math.min(100, Math.max(1, input.perPage ?? 10));
    const filter: ListClientsFilter = {
      search: input.search,
    };

    const [{ items, total }, allClients] = await Promise.all([
      this.clientRepository.findPaginated(input.storeId, filter, {
        page,
        perPage,
      }),
      this.clientRepository.findAll(input.storeId),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
      stats: computeStats(allClients),
    };
  }
}
