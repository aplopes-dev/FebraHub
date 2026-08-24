import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';
import type { CreatePropertyInput } from '../create-property/create-property.use-case';

export type UpdatePropertyInput = Omit<CreatePropertyInput, 'storeId'> & {
  storeId: string;
  id: string;
};

@Injectable()
export class UpdatePropertyUseCase implements IUseCase<
  UpdatePropertyInput,
  PropertyEntity
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute(input: UpdatePropertyInput): Promise<PropertyEntity> {
    const { storeId, id, ...payload } = input;
    const updated = await this.properties.update(storeId, id, payload);
    if (!updated) throw new PropertyNotFoundError(id);
    return updated;
  }
}
