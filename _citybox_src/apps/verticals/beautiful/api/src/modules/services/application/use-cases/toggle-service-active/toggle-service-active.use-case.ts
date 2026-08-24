import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import { ServiceRepository } from '../../../domain/repositories/service.repository.interface';
import { ServiceNotFoundError } from '../../../domain/errors/service-not-found.error';

export interface ToggleServiceActiveInput {
  storeId: string;
  id: string;
}

@Injectable()
export class ToggleServiceActiveUseCase implements IUseCase<
  ToggleServiceActiveInput,
  ServiceEntity
> {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: ToggleServiceActiveInput): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findById(
      input.storeId,
      input.id,
    );
    if (!service) {
      throw new ServiceNotFoundError(input.id);
    }

    service.toggleActive();
    await this.serviceRepository.save(service);
    return service;
  }
}
