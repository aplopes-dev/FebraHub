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
import { GetGoogleCalendarAuthUrlUseCase } from '../../../../application/use-cases/get-google-calendar-auth-url/get-google-calendar-auth-url.use-case';
import { GetGoogleCalendarAuthUrlPresenter } from './get-google-calendar-auth-url.presenter';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('v1/users/me/integrations/google-calendar')
export class GetGoogleCalendarAuthUrlRoute {
  constructor(private readonly getAuthUrl: GetGoogleCalendarAuthUrlUseCase) {}

  @Get('auth-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'URL OAuth2 Google Calendar (offline, calendar.events)',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const agentId = requireSelfAgentId(user, scope);
    const result = await this.getAuthUrl.execute({ storeId, agentId });
    return GetGoogleCalendarAuthUrlPresenter.toHttp(result);
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
