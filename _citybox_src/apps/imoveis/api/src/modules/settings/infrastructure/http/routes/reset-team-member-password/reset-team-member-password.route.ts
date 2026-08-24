import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ResetTeamMemberPasswordUseCase } from '../../../../application/use-cases/reset-team-member-password/reset-team-member-password.use-case';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class ResetTeamMemberPasswordRoute {
  constructor(private readonly resetPassword: ResetTeamMemberPasswordUseCase) {}

  @Post(':agentId/reset-password')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('update', 'Team')
  @ApiOperation({ summary: 'Gerar nova senha provisória Keycloak para membro' })
  async handle(@StoreId() storeId: string, @Param('agentId') agentId: string) {
    const result = await this.resetPassword.execute({ storeId, agentId });
    return { data: result };
  }
}
