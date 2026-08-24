import {
  Controller,
  Get,
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
import { GetGoogleCalendarStatusUseCase } from '../../../../application/use-cases/get-google-calendar-status/get-google-calendar-status.use-case';
import { GetGoogleCalendarStatusPresenter } from './get-google-calendar-status.presenter';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('v1/users/me/integrations/google-calendar')
export class GetGoogleCalendarStatusRoute {
  constructor(private readonly getStatus: GetGoogleCalendarStatusUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Status da integração Google Calendar do corretor' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const agentId = requireSelfAgentId(user, scope);
    const result = await this.getStatus.execute({ storeId, agentId });
    return GetGoogleCalendarStatusPresenter.toHttp(result);
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
