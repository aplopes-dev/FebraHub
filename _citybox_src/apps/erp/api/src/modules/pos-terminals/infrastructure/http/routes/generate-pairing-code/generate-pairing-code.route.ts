import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeneratePairingCodeUseCase } from '../../../../application/use-cases/generate-pairing-code/generate-pairing-code.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class GeneratePairingCodeRoute {
  constructor(
    private readonly generatePairingCode: GeneratePairingCodeUseCase,
  ) {}

  @Post(':id/pair')
  @RequirePermission('org.pos_terminals.manage')
  @ApiOperation({
    summary: 'Gerar código de pareamento',
    description:
      'Código opaco de 8 caracteres, válido por 15 minutos. Regenerar sobrescreve o anterior (não é cumulativo).',
  })
  @ApiResponse({ status: 404, description: 'Terminal não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.generatePairingCode.execute({
      organizationId,
      id,
    });
    return PosTerminalPresenter.toHttpPairingCode(result);
  }
}
