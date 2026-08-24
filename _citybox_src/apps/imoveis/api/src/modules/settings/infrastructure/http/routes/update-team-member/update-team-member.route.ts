import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpdateTeamMemberUseCase } from '../../../../application/use-cases/update-team-member/update-team-member.use-case';
import { parseTeamMemberPermissions } from '../../../../domain/mappers/team-member-permissions.mapper';
import { mapTeamMemberToHttp } from '../shared/team-member-response.mapper';
import { UpdateTeamMemberDto } from './update-team-member.dto';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class UpdateTeamMemberRoute {
  constructor(private readonly updateTeamMember: UpdateTeamMemberUseCase) {}

  @Put(':agentId')
  @RequirePermission('update', 'Team')
  @ApiOperation({ summary: 'Atualizar usuário da equipe' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    const member = await this.updateTeamMember.execute({
      storeId,
      agentId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      active: dto.active,
      permissions: dto.permissions
        ? parseTeamMemberPermissions(dto.permissions)
        : undefined,
    });
    return { data: mapTeamMemberToHttp(member) };
  }
}
