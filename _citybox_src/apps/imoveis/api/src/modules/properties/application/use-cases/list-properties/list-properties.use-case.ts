import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { PropertyEntity } from '../../../domain/entities/property.entity';
import {
  PropertyRepository,
  type ListPropertiesFilters,
} from '../../../domain/repositories/property.repository.interface';
import {
  parseCsvListingTypes,
  parseCsvNegotiable,
  parseCsvPropertyStatuses,
  parseCsvPropertyTypes,
} from '../../../domain/mappers/property-enum.mapper';

export type ListPropertiesInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  status?: string[];
  type?: string[];
  listingType?: string[];
  negotiable?: string[];
  agentId?: string;
};

export type ListPropertiesOutput = {
  items: PropertyEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListPropertiesUseCase implements IUseCase<
  ListPropertiesInput,
  ListPropertiesOutput
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute(input: ListPropertiesInput): Promise<ListPropertiesOutput> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(200, Math.max(1, Number(input.perPage ?? 8) || 8));

    let filters: ListPropertiesFilters;
    try {
      filters = {
        page,
        perPage,
        search: input.search?.trim() || undefined,
        status: parseCsvPropertyStatuses(input.status),
        type: parseCsvPropertyTypes(input.type),
        listingType: parseCsvListingTypes(input.listingType),
        negotiable: parseCsvNegotiable(input.negotiable),
        agentId: input.agentId?.trim() || undefined,
      };
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: 'ListPropertiesUseCase',
      });
    }

    const { items, total } = await this.properties.findMany(
      input.storeId,
      filters,
    );
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return { items, total, page, perPage, totalPages };
  }
}
