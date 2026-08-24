import { Injectable } from '@nestjs/common';

import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import {
  listCampaignTypes,
  type CampaignTypeCatalogItem,
} from '../../../domain/campaign-type-catalog';

export type ListCampaignTypesDto = {
  storeId: string;
};

export type ListCampaignTypesResult = {
  items: readonly CampaignTypeCatalogItem[];
};

/**
 * Catálogo de produto em memória — storeId é exigido pelo contrato store-scoped
 * das rotas da clínica, mas não filtra o catálogo (oferta fixa da plataforma).
 */
@Injectable()
export class ListCampaignTypesUseCase implements IUseCase<
  ListCampaignTypesDto,
  ListCampaignTypesResult
> {
  async execute(_dto: ListCampaignTypesDto): Promise<ListCampaignTypesResult> {
    return { items: listCampaignTypes() };
  }
}
