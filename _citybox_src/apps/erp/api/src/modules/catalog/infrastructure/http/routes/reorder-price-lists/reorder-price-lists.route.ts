import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReorderPriceListsUseCase } from '../../../../application/use-cases/reorder-price-lists/reorder-price-lists.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ReorderPriceListsDto } from '../shared/price-list.dto';
import { PriceListPresenter } from '../shared/price-list.presenter';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class ReorderPriceListsRoute {
  constructor(private readonly reorderPriceLists: ReorderPriceListsUseCase) {}

  @Put('reorder')
  @ApiOperation({ summary: 'Reordenar prioridade das listas de preços' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: ReorderPriceListsDto,
  ) {
    const lists = await this.reorderPriceLists.execute({
      organizationId,
      orderedIds: dto.orderedIds,
    });
    return PriceListPresenter.toHttpPriorityList(lists);
  }
}
