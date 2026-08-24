import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DeleteAgentSessionUseCase } from '../../../../application/use-cases/delete-agent-session/delete-agent-session.use-case';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/sessions')
export class DeleteAgentSessionRoute {
  constructor(private readonly deleteAgentSession: DeleteAgentSessionUseCase) {}

  @Delete(':sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Encerrar sessão de outro dispositivo' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    await this.deleteAgentSession.execute({ storeId, agentId, sessionId });
  }
}
