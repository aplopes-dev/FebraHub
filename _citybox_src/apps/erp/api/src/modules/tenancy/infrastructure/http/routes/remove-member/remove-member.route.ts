import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RemoveMemberUseCase } from '../../../../application/use-cases/remove-member/remove-member.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('members')
@Controller('v1/members')
export class RemoveMemberRoute {
  constructor(private readonly removeMember: RemoveMemberUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Remover membro',
    description:
      'Remove só o vínculo com esta organização. A conta no Keycloak sobrevive — a pessoa pode ser membro de outras empresas.',
  })
  @ApiResponse({ status: 204, description: 'Vínculo removido' })
  @ApiResponse({
    status: 403,
    description: 'Deixaria a organização sem responsável',
  })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.removeMember.execute({ organizationId, membershipId: id });
  }
}
