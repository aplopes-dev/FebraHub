import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListMembersUseCase } from '../../../../application/use-cases/list-members/list-members.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListMembersQueryDto } from '../shared/member.dto';
import { MemberPresenter } from '../shared/member.presenter';

@ApiTags('members')
@Controller('v1/members')
export class ListMembersRoute {
  constructor(private readonly listMembers: ListMembersUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar membros',
    description:
      'Equipe da organização ativa, com papel e unidades de cada um. O responsável (OWNER) vem primeiro.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListMembersQueryDto,
  ) {
    const result = await this.listMembers.execute({
      organizationId,
      search: query.search,
      activeOnly: query.active,
      isSeller: query.isSeller,
      page: query.page,
      perPage: query.perPage,
    });

    return MemberPresenter.toHttpList(result);
  }
}
