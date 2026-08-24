import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import { ServiceRepository } from '../../../domain/repositories/service.repository.interface';
import { ServiceNotFoundError } from '../../../domain/errors/service-not-found.error';

export interface UpdateServiceInput {
  storeId: string;
  id: string;
  name?: string;
  categories?: string[];
  durationMinutes?: number;
  price?: number;
  description?: string | null;
  active?: boolean;
}

@Injectable()
export class UpdateServiceUseCase implements IUseCase<
  UpdateServiceInput,
  ServiceEntity
> {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: UpdateServiceInput): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findById(
      input.storeId,
      input.id,
    );
    if (!service) {
      throw new ServiceNotFoundError(input.id);
    }

    service.update({
      name: input.name,
      categories: input.categories,
      durationMinutes: input.durationMinutes,
      price: input.price,
      description: input.description,
      active: input.active,
    });

    await this.serviceRepository.save(service);
    return service;
  }
}
