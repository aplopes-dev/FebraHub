import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindCustomerByIdUseCase } from '../../../../application/use-cases/find-customer-by-id/find-customer-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CustomerPresenter } from '../shared/customer.presenter';

@ApiTags('customers')
@Controller('v1/customers')
export class FindCustomerByIdRoute {
  constructor(private readonly findCustomer: FindCustomerByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar cliente',
    description: 'Inclui clientes soft-deleted (para restauração).',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const customer = await this.findCustomer.execute({ organizationId, id });
    return CustomerPresenter.toHttpSingle(customer);
  }
}
