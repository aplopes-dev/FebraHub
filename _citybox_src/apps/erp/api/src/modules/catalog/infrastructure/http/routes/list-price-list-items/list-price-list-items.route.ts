import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPriceListItemsUseCase } from '../../../../application/use-cases/list-price-list-items/list-price-list-items.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PriceListPresenter } from '../shared/price-list.presenter';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class ListPriceListItemsRoute {
  constructor(private readonly listItems: ListPriceListItemsUseCase) {}

  @Get(':id/items')
  @ApiOperation({ summary: 'Listar itens (preços) de uma lista' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const items = await this.listItems.execute({
      organizationId,
      priceListId: id,
    });
    return PriceListPresenter.toHttpItems(items);
  }
}
