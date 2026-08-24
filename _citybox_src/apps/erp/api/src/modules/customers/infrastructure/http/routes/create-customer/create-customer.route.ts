import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer/create-customer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  CreateCustomerHttpDto,
  toCustomerWritableInput,
} from '../shared/customer.dto';
import { CustomerPresenter } from '../shared/customer.presenter';

@ApiTags('customers')
@Controller('v1/customers')
export class CreateCustomerRoute {
  constructor(private readonly createCustomer: CreateCustomerUseCase) {}

  @Post()
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Cadastrar cliente' })
  @ApiResponse({ status: 201, description: 'Cliente criado' })
  @ApiResponse({ status: 409, description: 'Documento já cadastrado' })
  @ApiResponse({ status: 422, description: 'Dados inválidos' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateCustomerHttpDto,
  ) {
    const customer = await this.createCustomer.execute({
      organizationId,
      ...toCustomerWritableInput(dto),
    });
    return CustomerPresenter.toHttpSingle(customer);
  }
}
