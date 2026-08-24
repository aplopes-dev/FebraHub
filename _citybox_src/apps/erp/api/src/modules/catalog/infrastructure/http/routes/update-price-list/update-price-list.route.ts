import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePriceListUseCase } from '../../../../application/use-cases/update-price-list/update-price-list.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SavePriceListDto } from '../shared/price-list.dto';
import { toSavePriceListFields } from '../shared/price-list-http.mapper';
import { PriceListPresenter } from '../shared/price-list.presenter';
import { FindPriceListByIdUseCase } from '../../../../application/use-cases/find-price-list-by-id/find-price-list-by-id.use-case';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class UpdatePriceListRoute {
  constructor(
    private readonly updatePriceList: UpdatePriceListUseCase,
    private readonly findPriceList: FindPriceListByIdUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar lista de preços' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SavePriceListDto,
  ) {
    await this.updatePriceList.execute({
      organizationId,
      id,
      ...toSavePriceListFields(dto),
    });
    const { priceList, productCount } = await this.findPriceList.execute({
      organizationId,
      id,
    });
    return PriceListPresenter.toHttpSingle(priceList, productCount);
  }
}
