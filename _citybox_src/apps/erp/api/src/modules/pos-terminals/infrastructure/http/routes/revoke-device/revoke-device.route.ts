import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RevokeDeviceUseCase } from '../../../../application/use-cases/revoke-device/revoke-device.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class RevokeDeviceRoute {
  constructor(private readonly revokeDevice: RevokeDeviceUseCase) {}

  @Post(':id/revoke-device')
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({
    summary: 'Revogar o dispositivo pareado',
    description:
      'O terminal para de autenticar na chamada seguinte. Idempotente: revogar quem já não está pareado não é erro.',
  })
  @ApiResponse({ status: 404, description: 'Terminal não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const terminal = await this.revokeDevice.execute({ organizationId, id });
    return PosTerminalPresenter.toHttpSingle(terminal);
  }
}
