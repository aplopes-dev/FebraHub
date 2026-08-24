import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPriceListByIdUseCase } from '../../../../application/use-cases/find-price-list-by-id/find-price-list-by-id.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PriceListPresenter } from '../shared/price-list.presenter';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class FindPriceListByIdRoute {
  constructor(private readonly findPriceList: FindPriceListByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lista de preços por id' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const { priceList, productCount } = await this.findPriceList.execute({
      organizationId,
      id,
    });
    return PriceListPresenter.toHttpSingle(priceList, productCount);
  }
}
