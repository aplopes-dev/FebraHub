import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeleteTeamMemberUseCase } from '../../../../application/use-cases/delete-team-member/delete-team-member.use-case';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class DeleteTeamMemberRoute {
  constructor(private readonly deleteTeamMember: DeleteTeamMemberUseCase) {}

  @Delete(':agentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('delete', 'Team')
  @ApiOperation({ summary: 'Remover usuário da equipe' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
  ): Promise<void> {
    await this.deleteTeamMember.execute({ storeId, agentId });
  }
}
