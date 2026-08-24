import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCurrentSessionSalesUseCase } from '../../../../application/use-cases/list-current-session-sales/list-current-session-sales.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { ListSessionSalesQueryDto } from '../shared/pos-cash-session.dto';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/cash-sessions')
export class ListCurrentSessionSalesRoute {
  constructor(
    private readonly listCurrentSessionSales: ListCurrentSessionSalesUseCase,
  ) {}

  @Get('current/sales')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Vendas do turno aberto deste terminal (Device)',
    description:
      'Sem sessão open devolve lista vazia. Fonte de verdade para Últimas vendas no PDV.',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Query() query: ListSessionSalesQueryDto,
  ) {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const result = await this.listCurrentSessionSales.execute({
      organizationId: terminal.organizationId,
      posTerminalId: terminal.id,
      page,
      perPage,
    });
    return PosCashSessionPresenter.toHttpSales(result, page, perPage);
  }
}
