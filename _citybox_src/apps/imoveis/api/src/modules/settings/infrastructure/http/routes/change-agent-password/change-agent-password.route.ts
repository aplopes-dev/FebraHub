import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ChangeAgentPasswordUseCase } from '../../../../application/use-cases/change-agent-password/change-agent-password.use-case';
import { ChangeAgentPasswordDto } from './change-agent-password.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/password')
export class ChangeAgentPasswordRoute {
  constructor(
    private readonly changeAgentPassword: ChangeAgentPasswordUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Alterar a senha do usuário da equipe' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: ChangeAgentPasswordDto,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    await this.changeAgentPassword.execute({
      storeId,
      agentId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }
}
