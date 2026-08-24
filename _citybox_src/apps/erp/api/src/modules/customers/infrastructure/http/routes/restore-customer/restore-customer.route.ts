import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestoreCustomerUseCase } from '../../../../application/use-cases/restore-customer/restore-customer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CustomerPresenter } from '../shared/customer.presenter';

@ApiTags('customers')
@Controller('v1/customers')
export class RestoreCustomerRoute {
  constructor(private readonly restoreCustomer: RestoreCustomerUseCase) {}

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Restaurar cliente excluído' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const customer = await this.restoreCustomer.execute({
      organizationId,
      id,
    });
    return CustomerPresenter.toHttpSingle(customer);
  }
}
