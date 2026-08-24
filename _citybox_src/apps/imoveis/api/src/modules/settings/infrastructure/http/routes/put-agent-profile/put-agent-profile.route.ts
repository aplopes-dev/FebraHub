import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { PutAgentProfileUseCase } from '../../../../application/use-cases/put-agent-profile/put-agent-profile.use-case';
import { PutAgentProfileDto } from './put-agent-profile.dto';
import { PutAgentProfilePresenter } from './put-agent-profile.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile')
export class PutAgentProfileRoute {
  constructor(private readonly putAgentProfile: PutAgentProfileUseCase) {}

  @Put(':agentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Salvar perfil do corretor (próprio ou com Settings)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: PutAgentProfileDto,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    const profile = await this.putAgentProfile.execute({
      storeId,
      agentId,
      ...dto,
    });
    return PutAgentProfilePresenter.toHttp(profile);
  }
}
