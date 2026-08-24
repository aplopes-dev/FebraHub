import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { SyncPendingGoogleCalendarUseCase } from '../../../../application/use-cases/sync-pending-google-calendar/sync-pending-google-calendar.use-case';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('v1/users/me/integrations/google-calendar')
export class SyncPendingGoogleCalendarRoute {
  constructor(private readonly syncPending: SyncPendingGoogleCalendarUseCase) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reenvia compromissos locais sem googleEventId para o Google Calendar do corretor',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const agentId = requireSelfAgentId(user, scope);
    const result = await this.syncPending.execute({ storeId, agentId });
    return { data: result };
  }
}

function requireSelfAgentId(
  user: PermissionUser | undefined,
  scope: ImoveisScope | undefined,
): string {
  if (!user) throw new ForbiddenException('Sessão inválida');
  const agentId = scope?.agentId?.trim();
  if (!agentId) {
    throw new ForbiddenException(
      'Seu usuário não está vinculado a um corretor nesta loja',
    );
  }
  return agentId;
}
