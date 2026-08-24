import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DisconnectGoogleCalendarUseCase } from '../../../../application/use-cases/disconnect-google-calendar/disconnect-google-calendar.use-case';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('v1/users/me/integrations/google-calendar')
export class DisconnectGoogleCalendarRoute {
  constructor(private readonly disconnect: DisconnectGoogleCalendarUseCase) {}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Desconectar Google Calendar (remove refresh token do corretor)',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ): Promise<void> {
    const agentId = requireSelfAgentId(user, scope);
    await this.disconnect.execute({ storeId, agentId });
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
