import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
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
import { GetPropertyByIdUseCase } from '../../../../application/use-cases/get-property-by-id/get-property-by-id.use-case';
import { GetPropertyByIdPresenter } from './get-property-by-id.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class GetPropertyByIdRoute {
  constructor(private readonly getPropertyById: GetPropertyByIdUseCase) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Property')
  @ApiOperation({ summary: 'Detalhe do imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const property = await this.getPropertyById.execute({ storeId, id });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: property.agentId,
      context: 'property',
    });
    return GetPropertyByIdPresenter.toHttp(property);
  }
}
