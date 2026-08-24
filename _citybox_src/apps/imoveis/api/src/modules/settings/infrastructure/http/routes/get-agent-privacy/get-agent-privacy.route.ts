import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetAgentPrivacyUseCase } from '../../../../application/use-cases/get-agent-privacy/get-agent-privacy.use-case';
import { GetAgentPrivacyPresenter } from './get-agent-privacy.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/privacy')
export class GetAgentPrivacyRoute {
  constructor(private readonly getAgentPrivacy: GetAgentPrivacyUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Obter 2FA e sessões ativas do corretor' })
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
    const privacy = await this.getAgentPrivacy.execute({ storeId, agentId });
    return GetAgentPrivacyPresenter.toHttp(privacy);
  }
}
