import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetTerminalModulesUseCase } from '../../../../application/use-cases/get-terminal-modules/get-terminal-modules.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosModulePresenter } from '../shared/pos-module.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class CurrentTerminalModulesRoute {
  constructor(private readonly getTerminalModules: GetTerminalModulesUseCase) {}

  @Get('modules')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Módulos deste terminal',
    description:
      'Devolve o conjunto **resolvido**, nunca as duas camadas: se o app recebesse padrão e sobrescrita, teria de reimplementar a mesclagem — e uma divergência mostraria mesa que o ERP diz estar desligada.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const result = await this.getTerminalModules.execute({
      organizationId: terminal.organizationId,
      terminalId: terminal.id,
    });
    return PosModulePresenter.toDeviceHttp(result);
  }
}
