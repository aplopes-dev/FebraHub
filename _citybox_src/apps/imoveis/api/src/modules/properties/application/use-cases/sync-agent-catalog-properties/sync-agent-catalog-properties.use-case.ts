import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PropertyRepository } from '../../../domain/repositories/property.repository.interface';

export type SyncAgentCatalogPropertiesInput = {
  storeId: string;
  agentId: string;
  propertyIds: string[];
  fallbackAgentId?: string;
};

@Injectable()
export class SyncAgentCatalogPropertiesUseCase implements IUseCase<
  SyncAgentCatalogPropertiesInput,
  void
> {
  constructor(private readonly properties: PropertyRepository) {}

  async execute({
    storeId,
    agentId,
    propertyIds,
    fallbackAgentId,
  }: SyncAgentCatalogPropertiesInput): Promise<void> {
    await this.properties.syncAgentCatalog(
      storeId,
      agentId,
      propertyIds,
      fallbackAgentId ?? 'bruno-costa',
    );
  }
}
