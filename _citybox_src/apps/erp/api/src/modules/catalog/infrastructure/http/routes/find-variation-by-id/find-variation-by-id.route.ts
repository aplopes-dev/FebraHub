import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindVariationByIdUseCase } from '../../../../application/use-cases/find-variation-by-id/find-variation-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { VariationPresenter } from '../shared/variation.presenter';

@ApiTags('variations')
@Controller('v1/variations')
@RequirePermission('store.catalog.manage')
export class FindVariationByIdRoute {
  constructor(private readonly findVariation: FindVariationByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar variação por id' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    const variation = await this.findVariation.execute({
      organizationId,
      id,
    });
    return VariationPresenter.toHttpSingle(variation);
  }
}
