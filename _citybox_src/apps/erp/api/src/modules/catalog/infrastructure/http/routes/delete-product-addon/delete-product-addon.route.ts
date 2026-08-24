import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteProductAddonUseCase } from '../../../../application/use-cases/delete-product-addon/delete-product-addon.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('product-addons')
@Controller('v1/product-addons')
@RequirePermission('store.catalog.manage')
export class DeleteProductAddonRoute {
  constructor(private readonly deleteAddon: DeleteProductAddonUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir adicional do catálogo (soft-delete)' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
  ) {
    await this.deleteAddon.execute({ organizationId, id });
  }
}
