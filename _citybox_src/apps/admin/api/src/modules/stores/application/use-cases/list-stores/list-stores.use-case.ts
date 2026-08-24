import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import type { Store, StoreStatus } from '../../../domain/entities/store.entity';
import {
  STORE_VERTICALS,
  type StoreVertical,
} from '../../../domain/entities/store.entity';

export interface ListStoresDto {
  page?: number;
  perPage?: number;
  search?: string;
  vertical?: string[];
  status?: string[];
  createdFrom?: string;
  createdTo?: string;
}

export interface ListStoresResult {
  stores: Store[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

const VALID_STATUS: StoreStatus[] = [
  'IN_SETUP',
  'TRAINING',
  'PRODUCTION',
  'BLOCKED',
  'OFFLINE',
];

const VALID_VERTICALS: StoreVertical[] = [...STORE_VERTICALS];

@Injectable()
export class ListStoresUseCase implements IUseCase<
  ListStoresDto,
  ListStoresResult
> {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute({
    page = 1,
    perPage = 20,
    search,
    vertical,
    status,
    createdFrom,
    createdTo,
  }: ListStoresDto): Promise<ListStoresResult> {
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: search?.trim() || undefined,
      vertical: this.normalizeVertical(vertical),
      status: this.normalizeStatus(status),
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(createdTo) : undefined,
    };

    const [stores, total] = await Promise.all([
      this.storeRepository.findAll(criteria),
      this.storeRepository.count(criteria),
    ]);

    return {
      stores,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }

  private normalizeStatus(status?: string[]): StoreStatus[] | undefined {
    if (!status?.length) return undefined;
    const valid = status.filter((value): value is StoreStatus =>
      VALID_STATUS.includes(value as StoreStatus),
    );
    return valid.length ? valid : undefined;
  }

  private normalizeVertical(vertical?: string[]): StoreVertical[] | undefined {
    if (!vertical?.length) return undefined;
    const valid = vertical.filter((value): value is StoreVertical =>
      VALID_VERTICALS.includes(value as StoreVertical),
    );
    return valid.length ? valid : undefined;
  }
}
