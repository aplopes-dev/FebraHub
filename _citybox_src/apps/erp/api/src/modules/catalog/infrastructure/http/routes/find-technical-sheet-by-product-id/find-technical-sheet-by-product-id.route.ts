import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindTechnicalSheetByProductIdUseCase } from '../../../../application/use-cases/find-technical-sheet-by-product-id/find-technical-sheet-by-product-id.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { TechnicalSheetPresenter } from '../shared/technical-sheet.presenter';

@ApiTags('technical-sheets')
@Controller('v1/technical-sheets')
export class FindTechnicalSheetByProductIdRoute {
  constructor(
    private readonly findTechnicalSheetByProductId: FindTechnicalSheetByProductIdUseCase,
  ) {}

  @Get(':productId')
  @ApiOperation({ summary: 'Obter ficha técnica de um produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('productId') productId: string,
  ) {
    const detail = await this.findTechnicalSheetByProductId.execute({
      organizationId,
      productId,
    });
    return TechnicalSheetPresenter.toHttpDetail(detail);
  }
}
