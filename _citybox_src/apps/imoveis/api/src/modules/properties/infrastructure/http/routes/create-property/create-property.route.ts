import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolveWritableAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { CreatePropertyUseCase } from '../../../../application/use-cases/create-property/create-property.use-case';
import { PropertyWriteDto } from '../shared/property-write.dto';
import { CreatePropertyPresenter } from './create-property.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class CreatePropertyRoute {
  constructor(private readonly createProperty: CreatePropertyUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Criar imóvel' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: PropertyWriteDto,
  ) {
    const agentId = resolveWritableAgentId({
      user,
      scope,
      requestedAgentId: dto.agentId,
    });
    if (!agentId) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing agentId on create property',
        externalMessage:
          'Não foi possível identificar o corretor dono do imóvel.',
        context: CreatePropertyRoute.name,
      });
    }
    const property = await this.createProperty.execute({
      storeId,
      ...dto,
      agentId,
    });
    return CreatePropertyPresenter.toHttp(property);
  }
}
