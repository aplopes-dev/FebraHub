import { Controller, Delete, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteVariationUseCase } from '../../../../application/use-cases/delete-variation/delete-variation.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('variations')
@Controller('v1/variations')
@RequirePermission('store.catalog.manage')
export class DeleteVariationRoute {
  constructor(private readonly deleteVariation: DeleteVariationUseCase) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir variação do catálogo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteVariation.execute({ organizationId, id });
  }
}
