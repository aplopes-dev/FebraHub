import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import type { StoreAuditEventRow } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import type { ListStoreAuditLogDto } from '../../dtos/store-detail.dto';

export type ListStoreAuditLogResult = {
  items: StoreAuditEventRow[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

@Injectable()
export class ListStoreAuditLogUseCase implements IUseCase<
  ListStoreAuditLogDto,
  ListStoreAuditLogResult
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute(dto: ListStoreAuditLogDto): Promise<ListStoreAuditLogResult> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(ListStoreAuditLogUseCase.name, dto.storeId);
    }

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 10;
    const skip = (page - 1) * perPage;

    const result = await this.storeDetailRepository.listAuditEvents({
      storeId: dto.storeId,
      skip,
      take: perPage,
      severity: dto.severity,
      search: dto.search,
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.dateTo ? new Date(`${dto.dateTo}T23:59:59.999Z`) : undefined,
    });

    return {
      items: result.items,
      meta: {
        total: result.total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(result.total / perPage)),
      },
    };
  }
}
