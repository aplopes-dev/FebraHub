import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindUserByIdUseCase } from '../../../../application/use-cases/find-user-by-id/find-user-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FindUserByIdPresenter } from './find-user-by-id.presenter';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class FindUserByIdRoute {
  constructor(private readonly findUserById: FindUserByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async handle(@Param('id') id: string) {
    const user = await this.findUserById.execute({ id });
    return FindUserByIdPresenter.toHttp(user);
  }
}
