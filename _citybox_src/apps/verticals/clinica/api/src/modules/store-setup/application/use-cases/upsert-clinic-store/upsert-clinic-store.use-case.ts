import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStore } from '../../../domain/entities/clinic-store.entity';
import { ClinicStoreRepository } from '../../../domain/repositories/clinic-store.repository.interface';
import type { StorePlatformEventData } from '../../dtos/store-platform-event.dto';
import { mapEventToClinicStoreProps } from '../../mappers/store-platform-event.mapper';

@Injectable()
export class UpsertClinicStoreUseCase implements IUseCase<
  StorePlatformEventData,
  ClinicStore
> {
  constructor(private readonly clinicStoreRepository: ClinicStoreRepository) {}

  async execute(event: StorePlatformEventData): Promise<ClinicStore> {
    const existing = await this.clinicStoreRepository.findById(event.storeId);
    const props = mapEventToClinicStoreProps(event);

    if (existing) {
      return this.clinicStoreRepository.save(
        ClinicStore.with({
          ...props,
          syncedAt: new Date(),
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        }),
      );
    }

    return this.clinicStoreRepository.save(ClinicStore.create(props));
  }
}
