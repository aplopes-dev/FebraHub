import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePriceListUseCase } from '../../../../application/use-cases/create-price-list/create-price-list.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SavePriceListDto } from '../shared/price-list.dto';
import { toSavePriceListFields } from '../shared/price-list-http.mapper';
import { PriceListPresenter } from '../shared/price-list.presenter';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class CreatePriceListRoute {
  constructor(private readonly createPriceList: CreatePriceListUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar lista de preços' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: SavePriceListDto,
  ) {
    const priceList = await this.createPriceList.execute({
      organizationId,
      ...toSavePriceListFields(dto),
    });
    return PriceListPresenter.toHttpSingle(priceList, 0);
  }
}
