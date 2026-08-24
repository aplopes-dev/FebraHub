import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteCustomerUseCase } from '../../../../application/use-cases/delete-customer/delete-customer.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('customers')
@Controller('v1/customers')
export class DeleteCustomerRoute {
  constructor(private readonly deleteCustomer: DeleteCustomerUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('org.customers.manage')
  @ApiOperation({ summary: 'Excluir cliente (soft-delete)' })
  @ApiResponse({ status: 204, description: 'Cliente excluído' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteCustomer.execute({ organizationId, id });
  }
}
