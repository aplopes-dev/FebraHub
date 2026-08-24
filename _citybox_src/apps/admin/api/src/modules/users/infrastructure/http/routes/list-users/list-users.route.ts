import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListUsersUseCase } from '../../../../application/use-cases/list-users/list-users.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListUsersPresenter } from './list-users.presenter';
import { parseRolesParam } from './list-users.query';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class ListUsersRoute {
  constructor(private readonly listUsers: ListUsersUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuários da plataforma' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome ou e-mail',
  })
  @ApiQuery({
    name: 'roles',
    required: false,
    description:
      'Perfis separados por vírgula (platform_admin, platform_operator)',
  })
  async handle(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('roles') roles?: string | string[],
  ) {
    const result = await this.listUsers.execute({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      roles: parseRolesParam(roles),
    });
    return ListUsersPresenter.toHttp(result.users, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
