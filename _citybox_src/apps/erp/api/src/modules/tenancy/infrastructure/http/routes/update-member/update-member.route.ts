import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateMemberUseCase } from '../../../../application/use-cases/update-member/update-member.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateMemberHttpDto } from '../shared/member.dto';
import { MemberPresenter } from '../shared/member.presenter';

@ApiTags('members')
@Controller('v1/members')
export class UpdateMemberRoute {
  constructor(private readonly updateMember: UpdateMemberUseCase) {}

  @Put(':id')
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Atualizar membro',
    description:
      'Papel, situação e unidades. A organização não pode ficar sem um responsável ativo.',
  })
  @ApiResponse({
    status: 403,
    description: 'Deixaria a organização sem responsável',
  })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberHttpDto,
  ) {
    const detail = await this.updateMember.execute({
      organizationId,
      membershipId: id,
      role: dto.role,
      active: dto.active,
      permissionProfileId: dto.permissionProfileId,
      branchIds: dto.branchIds,
      pdvCode: dto.pdvCode,
      isSeller: dto.isSeller,
    });

    return MemberPresenter.toHttpSingle(detail);
  }
}
