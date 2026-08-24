import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCustomersUseCase } from '../../../../../customers/application/use-cases/list-customers/list-customers.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { ListPosCustomersQueryDto } from '../shared/pos-customer.dto';
import { PosCustomerPresenter } from '../shared/pos-customer.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class ListPosCustomersRoute {
  constructor(private readonly listCustomers: ListCustomersUseCase) {}

  @Get('customers')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Listar clientes deste terminal',
    description:
      'Busca paginada na organização do terminal. Soft-deleted ficam de fora (`tab=all`).',
  })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Query() query: ListPosCustomersQueryDto,
  ) {
    const result = await this.listCustomers.execute({
      organizationId: terminal.organizationId,
      search: query.search?.trim() || undefined,
      tab: 'all',
      page: query.page,
      perPage: query.perPage,
    });
    return PosCustomerPresenter.toHttpList(result);
  }
}
