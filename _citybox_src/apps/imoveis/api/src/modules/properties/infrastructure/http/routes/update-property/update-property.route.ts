import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { resolveWritableAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetPropertyByIdUseCase } from '../../../../application/use-cases/get-property-by-id/get-property-by-id.use-case';
import { UpdatePropertyUseCase } from '../../../../application/use-cases/update-property/update-property.use-case';
import { PropertyWriteDto } from '../shared/property-write.dto';
import { UpdatePropertyPresenter } from './update-property.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class UpdatePropertyRoute {
  constructor(
    private readonly getPropertyById: GetPropertyByIdUseCase,
    private readonly updateProperty: UpdatePropertyUseCase,
  ) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Atualizar imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: PropertyWriteDto,
  ) {
    const existing = await this.getPropertyById.execute({ storeId, id });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      context: 'property',
    });
    const agentId = resolveWritableAgentId({
      user,
      scope,
      requestedAgentId: dto.agentId ?? existing.agentId,
    });
    const property = await this.updateProperty.execute({
      storeId,
      id,
      ...dto,
      ...(agentId ? { agentId } : {}),
    });
    return UpdatePropertyPresenter.toHttp(property);
  }
}
