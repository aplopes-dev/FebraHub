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
import { PutAgentPrivacyUseCase } from '../../../../application/use-cases/put-agent-privacy/put-agent-privacy.use-case';
import { PutAgentPrivacyDto } from './put-agent-privacy.dto';
import { PutAgentPrivacyPresenter } from './put-agent-privacy.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/privacy')
export class PutAgentPrivacyRoute {
  constructor(private readonly putAgentPrivacy: PutAgentPrivacyUseCase) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar/desativar 2FA do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: PutAgentPrivacyDto,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    const profile = await this.putAgentPrivacy.execute({
      storeId,
      agentId,
      twoFactorEnabled: dto.twoFactorEnabled,
    });
    return PutAgentPrivacyPresenter.toHttp(profile);
  }
}
