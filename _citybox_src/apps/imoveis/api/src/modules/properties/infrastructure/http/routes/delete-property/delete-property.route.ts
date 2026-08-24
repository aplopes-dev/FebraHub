import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DeletePropertyUseCase } from '../../../../application/use-cases/delete-property/delete-property.use-case';
import { GetPropertyByIdUseCase } from '../../../../application/use-cases/get-property-by-id/get-property-by-id.use-case';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class DeletePropertyRoute {
  constructor(
    private readonly getPropertyById: GetPropertyByIdUseCase,
    private readonly deleteProperty: DeletePropertyUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Excluir imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const existing = await this.getPropertyById.execute({ storeId, id });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      context: 'property',
    });
    await this.deleteProperty.execute({ storeId, id });
  }
}
