import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';
import type {
  ApiListingType,
  ApiPropertyStatus,
  ApiPropertyType,
} from '../../../domain/mappers/property-enum.mapper';

export type CreatePropertyInput = {
  storeId: string;
  name: string;
  city?: string;
  state?: string;
  type: ApiPropertyType;
  units?: number;
  cost?: number;
  views?: number;
  status: ApiPropertyStatus;
  occupiedUnits?: number | null;
  listingType: ApiListingType;
  negotiable?: boolean;
  bedrooms?: number;
  floors?: number;
  sizeSqm?: number;
  yearBuilt?: number;
  address?: string;
  country?: string;
  zipCode?: string;
  mapCoordinate?: string;
  typeCode?: string | null;
  description?: string;
  highlights?: readonly string[];
  totalActiveLeads?: number;
  agentId?: string | null;
  activeLeads?: { id: string; name: string; initials: string }[];
};

@Injectable()
export class CreatePropertyUseCase implements IUseCase<
  CreatePropertyInput,
  PropertyEntity
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute(input: CreatePropertyInput): Promise<PropertyEntity> {
    const { storeId, ...payload } = input;
    return this.properties.create({ storeId, ...payload });
  }
}
