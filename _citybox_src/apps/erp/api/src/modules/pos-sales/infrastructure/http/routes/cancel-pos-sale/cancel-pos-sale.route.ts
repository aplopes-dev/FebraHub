import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelPosSaleUseCase } from '../../../../application/use-cases/cancel-pos-sale/cancel-pos-sale.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { CancelPosSaleHttpDto } from '../shared/cancel-pos-sale.dto';
import { PosSalePresenter } from '../shared/pos-sale.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class CancelPosSaleRoute {
  constructor(private readonly cancelPosSale: CancelPosSaleUseCase) {}

  @Post('sales/:id/cancel')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Cancela venda do PDV',
    description:
      'Marca SaleOrder como `cancelled`, estorna estoque (entrada reversa) e soft-delete dos recebíveis vinculados — bloqueia se houver conciliação bancária ativa. Exige turno aberto e permissão `pdv.operacao.venda.cancel`.',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id') id: string,
    @Body() dto: CancelPosSaleHttpDto,
  ) {
    const saleOrder = await this.cancelPosSale.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      posTerminalId: terminal.id,
      saleId: id,
      operatorId: dto.operatorId,
      authorizedByUserId: dto.authorizedByUserId,
      reason: dto.reason,
    });
    return PosSalePresenter.toHttpSingle(saleOrder);
  }
}
