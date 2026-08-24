import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpenCashSessionUseCase } from '../../../../application/use-cases/open-cash-session/open-cash-session.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { OpenCashSessionHttpDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/cash-sessions')
export class OpenCashSessionRoute {
  constructor(private readonly openCashSession: OpenCashSessionUseCase) {}

  @Post()
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Abre turno de caixa no terminal',
    description: '409 se já houver sessão open neste terminal.',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Body() dto: OpenCashSessionHttpDto,
  ) {
    const session = await this.openCashSession.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      posTerminalId: terminal.id,
      operatorUserId: dto.operatorUserId,
      openingFloatCents: dto.openingFloatCents,
    });
    return PosCashSessionPresenter.toHttpSingle(session);
  }
}
