import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePosSaleUseCase } from '../../../../application/use-cases/create-pos-sale/create-pos-sale.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { CreatePosSaleHttpDto } from '../shared/create-pos-sale.dto';
import { PosSalePresenter } from '../shared/pos-sale.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class CreatePosSaleRoute {
  constructor(private readonly createPosSale: CreatePosSaleUseCase) {}

  @Post('sales')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Finaliza venda do PDV (SaleOrder closed)',
    description:
      'Cria pedido canal `pdv` já fechado, com pagamentos obrigatórios e CPF/CNPJ na nota opcional. Baixa estoque quando houver itens controlados.',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Body() dto: CreatePosSaleHttpDto,
  ) {
    const saleOrder = await this.createPosSale.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
      posTerminalId: terminal.id,
      posDeliveryOrderId: dto.posDeliveryOrderId,
      operatorId: dto.operatorId,
      customerId: dto.customerId,
      customerName: dto.customerName,
      consumerDocument: dto.consumerDocument,
      sellerId: dto.sellerId,
      sellerName: dto.sellerName,
      notes: dto.notes,
      deliveryFeeCents: dto.deliveryFeeCents,
      discountsCents: dto.discountsCents,
      discountAuthorizedByUserId: dto.discountAuthorizedByUserId,
      lines: dto.lines,
      payments: dto.payments,
    });
    return PosSalePresenter.toHttpSingle(saleOrder);
  }
}
