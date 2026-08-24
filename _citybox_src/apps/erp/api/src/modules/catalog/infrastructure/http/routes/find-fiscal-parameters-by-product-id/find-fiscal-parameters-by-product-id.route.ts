import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindFiscalParametersByProductIdUseCase } from '../../../../application/use-cases/find-fiscal-parameters-by-product-id/find-fiscal-parameters-by-product-id.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ProductFiscalPresenter } from '../shared/product-fiscal.presenter';

@ApiTags('fiscal-parameters')
@Controller('v1/fiscal-parameters')
export class FindFiscalParametersByProductIdRoute {
  constructor(
    private readonly findFiscalParameters: FindFiscalParametersByProductIdUseCase,
  ) {}

  @Get(':productId')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Buscar parâmetros fiscais de um produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('productId') productId: string,
  ) {
    const detail = await this.findFiscalParameters.execute({
      organizationId,
      productId,
    });
    return ProductFiscalPresenter.toHttpDetail(detail);
  }
}
