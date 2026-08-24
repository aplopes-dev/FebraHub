import { Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ServiceEntity } from '../../../domain/entities/service.entity';
import { ServiceRepository } from '../../../domain/repositories/service.repository.interface';

export interface CreateServiceInput {
  storeId: string;
  name: string;
  categories?: string[];
  durationMinutes: number;
  price: number;
  description?: string | null;
  active?: boolean;
}

@Injectable()
export class CreateServiceUseCase implements IUseCase<
  CreateServiceInput,
  ServiceEntity
> {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async execute(input: CreateServiceInput): Promise<ServiceEntity> {
    const service = ServiceEntity.create({
      storeId: input.storeId,
      name: input.name,
      categories: input.categories ?? [],
      durationMinutes: input.durationMinutes,
      price: input.price,
      description: input.description ?? null,
      active: input.active ?? true,
      professionalIds: [],
    });

    await this.serviceRepository.save(service);
    return service;
  }
}
