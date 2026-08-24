import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

import { ListCampaignTypesUseCase } from '../../../application/use-cases/list-campaign-types/list-campaign-types.use-case';
import type { CampaignTypeCatalogItem } from '../../../domain/campaign-type-catalog';

function toCatalogResponse(item: CampaignTypeCatalogItem) {
  return {
    segment: item.segment,
    segmentLabel: item.segmentLabel,
    segmentDescription: item.segmentDescription,
    type: item.type,
    label: item.label,
    description: item.description,
    strategy: item.strategy,
    icon: item.icon,
    defaultChannel: item.defaultChannel,
    implemented: item.implemented,
  };
}

@ApiTags('campaign-types')
@Controller('v1/campaign-types')
@RequirePermission('read', 'Marketing')
export class CampaignTypesRoute {
  constructor(private readonly listCampaignTypes: ListCampaignTypesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tipos de campanha (taxonomia do produto)',
    description:
      'Catálogo fixo de segmento → tipo → estratégia. Create de campanha para tipos com implemented=true (form_lead, aniversario).',
  })
  async list(@StoreId() storeId: string) {
    const result = await this.listCampaignTypes.execute({ storeId });
    return {
      data: result.items.map(toCatalogResponse),
    };
  }
}
