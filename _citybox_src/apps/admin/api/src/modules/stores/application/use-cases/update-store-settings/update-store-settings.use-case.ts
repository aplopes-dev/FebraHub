import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { StoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreDetailRepository } from '../../../domain/repositories/store-detail.repository.interface';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import type { UpdateStoreSettingsDto } from '../../dtos/store-detail.dto';

@Injectable()
export class UpdateStoreSettingsUseCase implements IUseCase<
  UpdateStoreSettingsDto,
  Store
> {
  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly storeDetailRepository: StoreDetailRepository,
  ) {}

  async execute(dto: UpdateStoreSettingsDto): Promise<Store> {
    const store = await this.storeRepository.findById(dto.id);
    if (!store) {
      throw new StoreNotFoundError(UpdateStoreSettingsUseCase.name, dto.id);
    }

    store.updateSettings({
      maintenanceMode: dto.maintenanceMode,
      visibleInApp: dto.visibleInApp,
      status: dto.status,
      trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      sefazHomologacao: dto.sefazHomologacao,
      contingenciaOffline: dto.contingenciaOffline,
    });

    const saved = await this.storeRepository.save(store);

    await this.storeDetailRepository.recordAuditEvent({
      storeId: saved.id,
      severity: 'info',
      actor: dto.actor,
      module: 'Configurações',
      action: 'Atualizou configurações da loja',
      details: `Status: ${saved.status}`,
    });

    return saved;
  }
}
