import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SyncTerminalOperatorsUseCase } from '../../../../application/use-cases/sync-terminal-operators/sync-terminal-operators.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PdvCashierPresenter } from '../shared/pdv-cashier.presenter';

@ApiTags('pos-device')
@Controller('v1/pos/operators')
export class SyncTerminalOperatorsRoute {
  constructor(
    private readonly syncTerminalOperators: SyncTerminalOperatorsUseCase,
  ) {}

  @Get('sync')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Pacote de login offline (⚠️ contém hash de PIN)',
    description:
      'Única rota que devolve `pinHash` + `permissionIds` dos membros elegíveis.',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const result = await this.syncTerminalOperators.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
    });
    return PdvCashierPresenter.toHttpSync(result);
  }
}
