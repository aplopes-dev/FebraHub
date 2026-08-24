import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IMOVEL_ROLES } from '@citybox/imoveis-permissions';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { CurrentUser } from '../../../../../shared/infra/http/decorators/current-user.decorator';
import { SkipImoveisScope } from '../../../../../shared/infra/http/decorators/skip-imoveis-scope.decorator';
import { GetMyAccessUseCase } from '../../../application/use-cases/get-my-access.use-case';

@ApiTags('members')
@Controller('v1/members')
export class MembersRoute {
  constructor(private readonly getMyAccess: GetMyAccessUseCase) {}

  @Get('me')
  @SkipImoveisScope()
  @ApiOperation({ summary: 'Descoberta de acesso do usuário logado' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyAccess.execute(user.sub, user.email);
  }

  @Get('roles')
  @SkipImoveisScope()
  @ApiOperation({ summary: 'Catálogo de papéis da equipe' })
  roles() {
    return { data: IMOVEL_ROLES };
  }
}
