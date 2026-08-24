import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequireAnyPermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListTeamMembersUseCase } from '../../../../application/use-cases/list-team-members/list-team-members.use-case';
import { ListTeamMembersPresenter } from './list-team-members.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/users')
export class ListTeamMembersRoute {
  constructor(private readonly listTeamMembers: ListTeamMembersUseCase) {}

  @Get()
  /**
   * Admins (`Team`) e quem cria leads/negócios (`Lead` / `Transaction`)
   * precisam da lista para designar corretores — brokers não têm `users`.
   */
  @RequireAnyPermission(
    { action: 'manage', subject: 'Team' },
    { action: 'read', subject: 'Team' },
    { action: 'manage', subject: 'Lead' },
    { action: 'read', subject: 'Lead' },
    { action: 'manage', subject: 'Transaction' },
    { action: 'read', subject: 'Transaction' },
  )
  @ApiOperation({
    summary: 'Listar usuários da equipe',
    description:
      'Disponível para gestão de equipe e para quem designa corretores em leads/negócios.',
  })
  async handle(@StoreId() storeId: string) {
    const members = await this.listTeamMembers.execute({ storeId });
    return ListTeamMembersPresenter.toHttp(members);
  }
}
