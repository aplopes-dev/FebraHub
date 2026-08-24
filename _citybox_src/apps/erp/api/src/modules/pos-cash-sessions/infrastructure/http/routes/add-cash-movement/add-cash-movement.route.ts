import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddCashMovementUseCase } from '../../../../application/use-cases/add-cash-movement/add-cash-movement.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { AddCashMovementHttpDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/cash-sessions')
export class AddCashMovementRoute {
  constructor(private readonly addCashMovement: AddCashMovementUseCase) {}

  @Post(':id/movements')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Sangria ou reforço na sessão aberta' })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') sessionId: string,
    @Body() dto: AddCashMovementHttpDto,
  ) {
    const movement = await this.addCashMovement.execute({
      organizationId: terminal.organizationId,
      sessionId,
      type: dto.type,
      amountCents: dto.amountCents,
      reason: dto.reason,
      operatorUserId: dto.operatorUserId,
      authorizedByUserId: dto.authorizedByUserId,
    });
    return { data: PosCashSessionPresenter.toHttpMovement(movement) };
  }
}
