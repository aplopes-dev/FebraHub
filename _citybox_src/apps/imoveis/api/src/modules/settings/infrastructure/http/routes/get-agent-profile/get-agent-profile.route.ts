import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetAgentProfileUseCase } from '../../../../application/use-cases/get-agent-profile/get-agent-profile.use-case';
import { GetAgentProfilePresenter } from './get-agent-profile.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile')
export class GetAgentProfileRoute {
  constructor(private readonly getAgentProfile: GetAgentProfileUseCase) {}

  @Get(':agentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obter perfil do corretor (próprio ou com Settings)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'read',
    });
    const profile = await this.getAgentProfile.execute({ storeId, agentId });
    return GetAgentProfilePresenter.toHttp(profile);
  }
}
