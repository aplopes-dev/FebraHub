import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateMemberUseCase } from '../../../../application/use-cases/create-member/create-member.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateMemberHttpDto } from '../shared/member.dto';
import { MemberPresenter } from '../shared/member.presenter';

@ApiTags('members')
@Controller('v1/members')
export class CreateMemberRoute {
  constructor(private readonly createMember: CreateMemberUseCase) {}

  @Post()
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Cadastrar membro',
    description:
      'Cria a identidade no Keycloak e o vínculo na organização ativa. A senha provisória volta em `meta.provisionalPassword` — ela é exibida uma única vez e o Keycloak exige a troca no primeiro login.',
  })
  @ApiResponse({ status: 201, description: 'Membro cadastrado' })
  @ApiResponse({
    status: 409,
    description: 'E-mail já é membro desta organização',
  })
  @ApiResponse({
    status: 503,
    description: 'Keycloak indisponível ou não configurado',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateMemberHttpDto,
  ) {
    const result = await this.createMember.execute({
      organizationId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      permissionProfileId: dto.permissionProfileId,
      role: dto.role,
      branchIds: dto.branchIds,
      isSeller: dto.isSeller,
    });

    return MemberPresenter.toHttpCreated(result);
  }
}
