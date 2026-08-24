import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindCustomerCategoryByIdUseCase } from '../../../../application/use-cases/find-customer-category-by-id/find-customer-category-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CustomerCategoryPresenter } from '../shared/customer-category.presenter';

@ApiTags('customer-categories')
@Controller('v1/customer-categories')
export class FindCustomerCategoryByIdRoute {
  constructor(private readonly findCategory: FindCustomerCategoryByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar categoria de cliente' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const item = await this.findCategory.execute({ organizationId, id });
    return CustomerCategoryPresenter.toHttpSingle(item);
  }
}
