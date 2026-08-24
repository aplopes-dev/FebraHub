import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePriceListUseCase } from '../../../../application/use-cases/delete-price-list/delete-price-list.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('price-lists')
@Controller('v1/price-lists')
export class DeletePriceListRoute {
  constructor(private readonly deletePriceList: DeletePriceListUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lista de preços' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deletePriceList.execute({ organizationId, id });
  }
}
