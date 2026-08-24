import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUserUseCase } from '../../../../application/use-cases/update-user/update-user.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpdateUserDto } from './update-user.dto';
import { UpdateUserPresenter } from './update-user.presenter';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class UpdateUserRoute {
  constructor(private readonly updateUser: UpdateUserUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar dados do usuário' })
  async handle(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.updateUser.execute({ id, ...dto });
    return UpdateUserPresenter.toHttp(user);
  }
}
