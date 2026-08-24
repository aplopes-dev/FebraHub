import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCurrentTerminalUseCase } from '../../../../application/use-cases/get-current-terminal/get-current-terminal.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../domain/entities/pos-terminal.entity';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

/**
 * Quem sou eu — a rota que o PDV chama no boot para saber se a credencial
 * dele ainda vale.
 *
 * `@Public()` desliga a cadeia global do Keycloak; `DeviceAuthGuard` assume no
 * lugar. É o par que toda rota `v1/pos/*` usa: prefixo separado justamente
 * para não misturar com as rotas de backoffice e acabar protegendo a errada.
 */
@ApiTags('pos-device')
@Controller('v1/pos')
export class CurrentTerminalRoute {
  constructor(
    private readonly getCurrentTerminal: GetCurrentTerminalUseCase,
  ) {}

  @Get('terminal')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Dados do terminal autenticado pela credencial de dispositivo',
    description:
      'Responde 401 se a credencial foi revogada ou o terminal desativado — é assim que o PDV descobre que precisa ser reativado. Inclui organizationName/branchName para branding.',
  })
  @ApiResponse({ status: 401, description: 'Terminal não autorizado' })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const result = await this.getCurrentTerminal.execute({ terminal });
    return PosTerminalPresenter.toHttpSingle(result.terminal, {
      organizationName: result.organizationName,
      branchName: result.branchName,
    });
  }
}
