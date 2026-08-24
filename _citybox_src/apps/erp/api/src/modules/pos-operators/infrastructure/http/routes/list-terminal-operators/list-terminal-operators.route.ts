import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTerminalOperatorsUseCase } from '../../../../application/use-cases/list-terminal-operators/list-terminal-operators.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PdvCashierPresenter } from '../shared/pdv-cashier.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/operators')
export class ListTerminalOperatorsRoute {
  constructor(
    private readonly listTerminalOperators: ListTerminalOperatorsUseCase,
  ) {}

  @Get()
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Caixas elegíveis da unidade do terminal (Membership)',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const operators = await this.listTerminalOperators.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
    });
    return PdvCashierPresenter.toHttpList(operators);
  }
}
