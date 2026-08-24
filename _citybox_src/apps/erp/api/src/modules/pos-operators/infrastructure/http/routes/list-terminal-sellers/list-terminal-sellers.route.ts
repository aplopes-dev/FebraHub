import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTerminalSellersUseCase } from '../../../../application/use-cases/list-terminal-sellers/list-terminal-sellers.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';

@ApiTags('pos-device')
@Controller('v1/pos/sellers')
export class ListTerminalSellersRoute {
  constructor(
    private readonly listTerminalSellers: ListTerminalSellersUseCase,
  ) {}

  @Get()
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary:
      'Vendedores elegíveis da unidade do terminal (Membership.isSeller)',
  })
  async handle(@CurrentTerminal() terminal: PosTerminal) {
    const sellers = await this.listTerminalSellers.execute({
      organizationId: terminal.organizationId,
      branchId: terminal.branchId,
    });
    return {
      data: sellers.map((seller) => ({
        id: seller.id,
        membershipId: seller.membershipId,
        code: seller.code,
        name: seller.name,
      })),
    };
  }
}
