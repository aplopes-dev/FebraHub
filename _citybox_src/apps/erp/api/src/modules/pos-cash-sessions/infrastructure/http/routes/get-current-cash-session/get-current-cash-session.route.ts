import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCurrentCashSessionUseCase } from '../../../../application/use-cases/get-current-cash-session/get-current-cash-session.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/cash-sessions')
export class GetCurrentCashSessionRoute {
  constructor(
    private readonly getCurrentCashSession: GetCurrentCashSessionUseCase,
  ) {}

  @Get('current')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Sessão de caixa aberta do terminal (ou null)' })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const session = await this.getCurrentCashSession.execute({
      organizationId: terminal.organizationId,
      posTerminalId: terminal.id,
    });
    return PosCashSessionPresenter.toHttpSingle(session);
  }
}
