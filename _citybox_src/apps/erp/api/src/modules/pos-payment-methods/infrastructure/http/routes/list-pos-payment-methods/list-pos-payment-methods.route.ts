import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPosPaymentMethodsUseCase } from '../../../../application/use-cases/list-pos-payment-methods/list-pos-payment-methods.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosPaymentMethodPresenter } from '../shared/pos-payment-method.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class ListPosPaymentMethodsRoute {
  constructor(
    private readonly listPosPaymentMethods: ListPosPaymentMethodsUseCase,
  ) {}

  @Get('payment-methods')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Formas de pagamento ativas do terminal',
    description:
      'Catálogo da organização do terminal (sem paginação). O PDV usa `systemKey` para mapear dinheiro/cartão/PIX.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const methods = await this.listPosPaymentMethods.execute({
      organizationId: terminal.organizationId,
    });
    return PosPaymentMethodPresenter.toHttpList(methods);
  }
}
