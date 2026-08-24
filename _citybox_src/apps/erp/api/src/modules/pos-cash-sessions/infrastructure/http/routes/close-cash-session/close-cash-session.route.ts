import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CloseCashSessionUseCase } from '../../../../application/use-cases/close-cash-session/close-cash-session.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { CloseCashSessionHttpDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/cash-sessions')
export class CloseCashSessionRoute {
  constructor(private readonly closeCashSession: CloseCashSessionUseCase) {}

  @Post(':id/close')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Fecha o turno e calcula expectedCash' })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') sessionId: string,
    @Body() dto: CloseCashSessionHttpDto,
  ) {
    const session = await this.closeCashSession.execute({
      organizationId: terminal.organizationId,
      sessionId,
      countedCashCents: dto.countedCashCents,
      countedCreditCents: dto.countedCreditCents,
      countedDebitCents: dto.countedDebitCents,
      countedVoucherCents: dto.countedVoucherCents,
      countedOtherCents: dto.countedOtherCents,
    });
    return PosCashSessionPresenter.toHttpSingle(session);
  }
}
