import { Controller, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteUnitOfMeasureUseCase } from '../../../../application/use-cases/delete-unit-of-measure/delete-unit-of-measure.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('units-of-measure')
@Controller('v1/units-of-measure')
@RequirePermission('store.catalog.manage')
export class DeleteUnitOfMeasureRoute {
  constructor(private readonly deleteUnit: DeleteUnitOfMeasureUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir unidade de medida' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteUnit.execute({ organizationId, id });
  }
}
