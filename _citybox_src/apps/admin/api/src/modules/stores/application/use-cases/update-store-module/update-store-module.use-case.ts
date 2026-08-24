import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { getModuleCatalogItem } from '../../../domain/catalog/store-vertical.catalog';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import type { UpdateStoreModuleDto } from '../../dtos/store-detail.dto';

@Injectable()
export class UpdateStoreModuleUseCase implements IUseCase<
  UpdateStoreModuleDto,
  void
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute(dto: UpdateStoreModuleDto): Promise<void> {
    const store = await this.storeRepository.findById(dto.storeId);
    if (!store) {
      throw new StoreNotFoundError(UpdateStoreModuleUseCase.name, dto.storeId);
    }

    await this.storeDetailRepository.ensureCatalog(store.id, store.vertical);

    const catalogItem = getModuleCatalogItem(store.vertical, dto.moduleKey);
    if (!catalogItem) {
      throw new StoreNotFoundError(
        UpdateStoreModuleUseCase.name,
        dto.moduleKey,
      );
    }

    await this.storeDetailRepository.updateModuleEnabled(
      store.id,
      dto.moduleKey,
      dto.enabled,
    );

    await this.storeDetailRepository.recordAuditEvent({
      storeId: store.id,
      severity: 'info',
      actor: dto.actor,
      module: 'Módulos',
      action: dto.enabled
        ? `Ativou módulo ${catalogItem.label}`
        : `Desativou módulo ${catalogItem.label}`,
    });
  }
}
