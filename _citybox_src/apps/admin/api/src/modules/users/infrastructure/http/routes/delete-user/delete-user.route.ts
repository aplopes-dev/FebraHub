import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteUserUseCase } from '../../../../application/use-cases/delete-user/delete-user.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class DeleteUserRoute {
  constructor(private readonly deleteUser: DeleteUserUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover usuário da plataforma e do Keycloak' })
  async handle(@Param('id') id: string) {
    await this.deleteUser.execute({ id });
  }
}
