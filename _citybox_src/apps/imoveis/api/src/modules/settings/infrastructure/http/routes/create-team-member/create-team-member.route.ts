import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateTeamMemberUseCase } from '../../../../application/use-cases/create-team-member/create-team-member.use-case';
import { parseTeamMemberPermissions } from '../../../../domain/mappers/team-member-permissions.mapper';
import { CreateTeamMemberDto } from './create-team-member.dto';
import { CreateTeamMemberPresenter } from './create-team-member.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class CreateTeamMemberRoute {
  constructor(private readonly createTeamMember: CreateTeamMemberUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('create', 'Team')
  @ApiOperation({ summary: 'Criar usuário da equipe com senha provisória' })
  async handle(@StoreId() storeId: string, @Body() dto: CreateTeamMemberDto) {
    const result = await this.createTeamMember.execute({
      storeId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      active: dto.active,
      permissions: dto.permissions
        ? parseTeamMemberPermissions(dto.permissions)
        : undefined,
    });
    return CreateTeamMemberPresenter.toHttpWithPassword(result);
  }
}
