import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResendInviteUseCase } from '../../../../application/use-cases/resend-invite/resend-invite.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('users')
@Controller('v1/users')
@RequirePermission('platform.admin')
export class ResendInviteRoute {
  constructor(private readonly resendInvite: ResendInviteUseCase) {}

  @Post(':id/resend-invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reenviar e-mail de convite para criação de senha' })
  async handle(@Param('id') id: string): Promise<void> {
    await this.resendInvite.execute({ id });
  }
}
