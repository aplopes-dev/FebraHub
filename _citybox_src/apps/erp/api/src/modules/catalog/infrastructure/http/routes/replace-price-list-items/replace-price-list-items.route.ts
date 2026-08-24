import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReplacePriceListItemsUseCase } from '../../../../application/use-cases/replace-price-list-items/replace-price-list-items.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ReplacePriceListItemsDto } from '../shared/price-list.dto';
import { PriceListPresenter } from '../shared/price-list.presenter';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class ReplacePriceListItemsRoute {
  constructor(private readonly replaceItems: ReplacePriceListItemsUseCase) {}

  @Put(':id/items')
  @ApiOperation({ summary: 'Substituir itens (preços) de uma lista' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: ReplacePriceListItemsDto,
  ) {
    const items = await this.replaceItems.execute({
      organizationId,
      priceListId: id,
      items: dto.items,
    });
    return PriceListPresenter.toHttpItems(items);
  }
}
