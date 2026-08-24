import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateCustomerUseCase } from '../../../../application/use-cases/update-customer/update-customer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  UpdateCustomerHttpDto,
  toCustomerWritableInput,
} from '../shared/customer.dto';
import { CustomerPresenter } from '../shared/customer.presenter';

@ApiTags('customers')
@Controller('v1/customers')
export class UpdateCustomerRoute {
  constructor(private readonly updateCustomer: UpdateCustomerUseCase) {}

  @Put(':id')
  @RequirePermission('org.customers.manage')
  @ApiOperation({
    summary: 'Atualizar cliente',
    description: 'Semântica PUT: campo omitido é limpo.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerHttpDto,
  ) {
    const customer = await this.updateCustomer.execute({
      organizationId,
      id,
      ...toCustomerWritableInput(dto),
      branchIds: dto.branchIds,
    });
    return CustomerPresenter.toHttpSingle(customer);
  }
}
