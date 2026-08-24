import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../../../application/use-cases/create-user/create-user.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateUserDto } from './create-user.dto';
import { CreateUserPresenter } from './create-user.presenter';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class CreateUserRoute {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar usuário via Keycloak' })
  async handle(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute(dto);
    return CreateUserPresenter.toHttp(user);
  }
}
