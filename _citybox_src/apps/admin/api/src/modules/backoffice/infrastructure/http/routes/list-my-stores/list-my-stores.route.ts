import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../../../shared/infra/http/auth/authenticated-user';
import { ListMyStoresUseCase } from '../../../../application/use-cases/list-my-stores/list-my-stores.use-case';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
export class ListMyStoresRoute {
  constructor(private readonly listMyStores: ListMyStoresUseCase) {}

  @Get('me/stores')
  @ApiOperation({
    summary: 'Lojas vinculadas ao usuário autenticado (backoffice/ERP)',
  })
  async handle(@Req() req: Request & { user?: AuthenticatedUser }) {
    const user = req.user;
    if (!user?.sub) throw new UnauthorizedException();

    const stores = await this.listMyStores.execute(user.sub);
    return { stores };
  }
}
