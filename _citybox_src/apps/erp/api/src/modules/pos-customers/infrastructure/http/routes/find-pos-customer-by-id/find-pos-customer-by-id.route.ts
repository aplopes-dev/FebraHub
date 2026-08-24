import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindCustomerByIdUseCase } from '../../../../../customers/application/use-cases/find-customer-by-id/find-customer-by-id.use-case';
import { CustomerNotFoundError } from '../../../../../customers/domain/errors/customer-not-found.error';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import { PosCustomerPresenter } from '../shared/pos-customer.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class FindPosCustomerByIdRoute {
  constructor(private readonly findCustomerById: FindCustomerByIdUseCase) {}

  @Get('customers/:id')
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({ summary: 'Detalhe de cliente deste terminal' })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const customer = await this.findCustomerById.execute({
      organizationId: terminal.organizationId,
      id,
    });
    if (customer.deletedAt) {
      throw new CustomerNotFoundError(id);
    }
    return PosCustomerPresenter.toHttpSingle(customer);
  }
}
