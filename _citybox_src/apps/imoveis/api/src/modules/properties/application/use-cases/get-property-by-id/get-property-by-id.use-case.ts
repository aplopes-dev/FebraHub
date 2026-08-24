import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

@Injectable()
export class GetPropertyByIdUseCase implements IUseCase<
  { storeId: string; id: string },
  PropertyEntity
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute({
    storeId,
    id,
  }: {
    storeId: string;
    id: string;
  }): Promise<PropertyEntity> {
    const property = await this.properties.findById(storeId, id);
    if (!property) throw new PropertyNotFoundError(id);
    return property;
  }
}
