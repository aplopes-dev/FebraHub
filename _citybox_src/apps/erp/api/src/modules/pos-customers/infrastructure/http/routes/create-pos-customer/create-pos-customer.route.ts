import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../../../../customers/application/use-cases/create-customer/create-customer.use-case';
import { CurrentTerminal } from '../../../../../../shared/infra/http/decorators/current-terminal.decorator';
import { Public } from '../../../../../../shared/infra/http/decorators/public.decorator';
import { DeviceAuthGuard } from '../../../../../../shared/infra/http/guards/device-auth.guard';
import type { PosTerminal } from '../../../../../pos-terminals/domain/entities/pos-terminal.entity';
import {
  CreatePosCustomerHttpDto,
  toPosCustomerCreateInput,
} from '../shared/pos-customer.dto';
import { PosCustomerPresenter } from '../shared/pos-customer.presenter';

@ApiTags('pos-device')
@Controller('v1/pos')
export class CreatePosCustomerRoute {
  constructor(private readonly createCustomer: CreateCustomerUseCase) {}

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @UseGuards(DeviceAuthGuard)
  @ApiOperation({
    summary: 'Cadastro rápido de cliente no PDV',
    description:
      'Persiste no CRM da organização. Unidade = branch do terminal; stage = active.',
  })
  @ApiResponse({ status: 201, description: 'Cliente criado' })
  @ApiResponse({ status: 409, description: 'Documento já cadastrado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  async handle(
    @CurrentTerminal() terminal: PosTerminal,
    @Body() dto: CreatePosCustomerHttpDto,
  ) {
    const customer = await this.createCustomer.execute({
      organizationId: terminal.organizationId,
      ...toPosCustomerCreateInput(dto, terminal.branchId),
    });
    return PosCustomerPresenter.toHttpSingle(customer);
  }
}
