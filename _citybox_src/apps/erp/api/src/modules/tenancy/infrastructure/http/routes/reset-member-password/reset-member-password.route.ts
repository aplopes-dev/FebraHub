import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResetMemberPasswordUseCase } from '../../../../application/use-cases/reset-member-password/reset-member-password.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('members')
@Controller('v1/members')
export class ResetMemberPasswordRoute {
  constructor(
    private readonly resetMemberPassword: ResetMemberPasswordUseCase,
  ) {}

  @Post(':id/reset-password')
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Gerar nova senha provisória',
    description:
      'Devolve uma senha de primeiro acesso nova. A anterior deixa de valer e o Keycloak volta a exigir a troca no login.',
  })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  @ApiResponse({ status: 503, description: 'Keycloak indisponível' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.resetMemberPassword.execute({
      organizationId,
      membershipId: id,
    });

    return {
      data: {
        email: result.email,
        provisionalPassword: result.provisionalPassword,
      },
    };
  }
}
